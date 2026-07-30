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

    // The SW tells us when a queued report was dropped for good (a terminal
    // error). Surface it instead of losing it silently — any UI can listen for
    // the `outbox-dropped` window event.
    const onMessage = (e: MessageEvent) => {
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
    };
  }, []);

  return null;
}
