"use client";

import { useEffect, useState } from "react";
import { pushSupported, subscribeToPush } from "@/lib/push-client";

type State = "loading" | "unsupported" | "denied" | "off" | "on";

export default function PushManager() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      // Use getRegistration() (resolves immediately, undefined if none) instead
      // of serviceWorker.ready, which never resolves when no SW is registered
      // (e.g. in dev, where /sw.js isn't emitted).
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return setState("unsupported");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      await subscribeToPush();
      setState("on");
    } catch (e) {
      setState(Notification.permission === "denied" ? "denied" : "off");
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Nothing to show when push is unavailable or already enabled — the user
  // only needs this prompt when they haven't opted in yet.
  if (state === "loading" || state === "unsupported" || state === "on")
    return null;

  if (state === "denied") {
    return (
      <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Notificaciones bloqueadas. Habilitalas en los ajustes del navegador
          para recibir avisos sobre tus vehículos.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Notificaciones push</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recibí un aviso al instante cuando reportan tu vehículo.
          </p>
        </div>
        <button
          onClick={enable}
          disabled={busy}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Activar"}
        </button>
      </div>
    </div>
  );
}
