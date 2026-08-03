import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, BackgroundSyncQueue } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ---------------------------------------------------------------------
// Offline outbox: queue report / alert POSTs made while offline and
// replay them automatically when connectivity returns (Background Sync).
// ---------------------------------------------------------------------
async function messageClients(msg: unknown) {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) client.postMessage(msg);
}

// Unlike the default replay, a request is only dropped once the server truly
// accepts it. Transient failures (offline, 401 expired session, 408/429, 5xx)
// are put back and retried later; only a terminal 4xx is dropped, and the UI
// is told so it isn't a silent loss. Idempotency (clientId) makes retries safe.
async function replayOutbox({ queue }: { queue: BackgroundSyncQueue }) {
  let entry: Awaited<ReturnType<BackgroundSyncQueue["shiftRequest"]>>;
  while ((entry = await queue.shiftRequest())) {
    try {
      const res = await fetch(entry.request.clone());
      if (!res.ok) {
        const transient =
          res.status === 401 ||
          res.status === 408 ||
          res.status === 429 ||
          res.status >= 500;
        if (transient) {
          await queue.unshiftRequest(entry);
          return; // stop; retry on the next online / sync trigger
        }
        await messageClients({ type: "OUTBOX_DROPPED", status: res.status });
      }
    } catch {
      // Network still unavailable: put it back and stop.
      await queue.unshiftRequest(entry);
      return;
    }
  }
}

const outbox = new BackgroundSyncQueue("outbox", {
  maxRetentionTime: 24 * 60, // minutes -> keep for 24h
  onSync: replayOutbox,
});

const OFFLINE_QUEUEABLE = ["/api/reports", "/api/alerts"];

// iOS/WebKit lacks the Background Sync API, so Serwist only replays the queue
// on SW startup. The client pings us (on `online`/app-resume) to flush the
// outbox explicitly — the reliable cross-platform trigger.
self.addEventListener("message", (event) => {
  if (event.data?.type === "REPLAY_OUTBOX") {
    event.waitUntil(replayOutbox({ queue: outbox }).catch(() => {}));
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "POST") return;

  const url = new URL(req.url);
  if (!OFFLINE_QUEUEABLE.some((p) => url.pathname.startsWith(p))) return;

  const clone = req.clone();
  event.respondWith(
    fetch(req).catch(async () => {
      await outbox.pushRequest({ request: clone });
      // Tell the client it was accepted for deferred send, and that something
      // is now queued. A request can be queued by a *transient* failure while
      // the user is still online and foregrounded — where no `online` or
      // `visibilitychange` event ever fires — so the client schedules a replay
      // instead of letting it sit in the queue indefinitely.
      await messageClients({ type: "OUTBOX_QUEUED" });
      return new Response(JSON.stringify({ queued: true, offline: true }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});

// ---------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data: {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
    image?: string;
  } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }

  // `image` and `renotify` are valid at runtime but missing from the TS
  // NotificationOptions lib type — widen it.
  const options: NotificationOptions & { image?: string; renotify?: boolean } =
    {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      image: data.image,
      tag: data.tag,
      renotify: !!data.tag,
      data: { url: data.url ?? "/notificaciones" },
    };

  event.waitUntil(
    self.registration.showNotification(
      data.title ?? process.env.NEXT_PUBLIC_APP_NAME ?? "Alerta Patente",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data?.url as string) ?? "/";

  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of wins) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

// ---------------------------------------------------------------------
// Serwist: precache app shell + runtime caching + offline fallback.
// ---------------------------------------------------------------------
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
