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
  }, []);

  return null;
}
