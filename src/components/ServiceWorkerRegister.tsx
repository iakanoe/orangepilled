"use client";

import { useEffect } from "react";

// Registers the Serwist-built service worker. Disabled in dev (no /sw.js
// is emitted there — see `disable` in next.config.mjs).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("SW registration failed", err);
    });

    // Flush the offline outbox on reconnect / app-resume. Needed because iOS
    // has no Background Sync API — without this, reports queued while offline
    // would wait until the SW next restarts.
    const flush = () => {
      if (!navigator.onLine) return;
      navigator.serviceWorker.ready
        .then((reg) => reg.active?.postMessage({ type: "REPLAY_OUTBOX" }))
        .catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") flush();
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisible);
    flush();

    // A request can be queued by a transient network failure even while the
    // user stays online and foregrounded — a case where neither `online` nor
    // `visibilitychange` ever fires. Retry with backoff as soon as the SW tells
    // us something was queued, and keep a slow periodic flush as a safety net,
    // so nothing lingers in the outbox unsent.
    const retryTimers: ReturnType<typeof setTimeout>[] = [];
    const scheduleRetries = () => {
      retryTimers.forEach(clearTimeout);
      retryTimers.length = 0;
      for (const delay of [2000, 6000, 15000, 30000]) {
        retryTimers.push(setTimeout(flush, delay));
      }
    };
    const periodic = setInterval(() => {
      if (document.visibilityState === "visible") flush();
    }, 30000);

    // The SW tells us when a queued report was dropped for good (a terminal
    // error). Surface it instead of losing it silently — any UI can listen for
    // the `outbox-dropped` window event.
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "OUTBOX_QUEUED") {
        scheduleRetries();
      }
      if (e.data?.type === "OUTBOX_DROPPED") {
        console.warn("Reporte encolado descartado por el servidor", e.data);
        window.dispatchEvent(
          new CustomEvent("outbox-dropped", { detail: e.data }),
        );
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      retryTimers.forEach(clearTimeout);
      clearInterval(periodic);
    };
  }, []);

  return null;
}
