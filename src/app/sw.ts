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
const outbox = new BackgroundSyncQueue("outbox", {
  maxRetentionTime: 24 * 60, // minutes -> keep for 24h
});

const OFFLINE_QUEUEABLE = ["/api/reports", "/api/alerts"];

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "POST") return;

  const url = new URL(req.url);
  if (!OFFLINE_QUEUEABLE.some((p) => url.pathname.startsWith(p))) return;

  const clone = req.clone();
  event.respondWith(
    fetch(req).catch(async () => {
      await outbox.pushRequest({ request: clone });
      // Tell the client it was accepted for deferred send.
      return new Response(
        JSON.stringify({ queued: true, offline: true }),
        { status: 202, headers: { "Content-Type": "application/json" } },
      );
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
  const options: NotificationOptions & { image?: string; renotify?: boolean } = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    image: data.image,
    tag: data.tag,
    renotify: !!data.tag,
    data: { url: data.url ?? "/notificaciones" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Alerta Patente", options),
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
