"use client";

import { useEffect, useState } from "react";
import { pushSupported, subscribeToPush } from "@/lib/push-client";

type State = "loading" | "unsupported" | "denied" | "off" | "on";

export default function PushManager({
  variant = "prompt",
}: {
  variant?: "prompt" | "settings";
}) {
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

  // Settings variant: always render a status row so the surrounding card is
  // never empty (used in the configuración page).
  if (variant === "settings") {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Notificaciones push</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {state === "loading"
              ? "Comprobando estado…"
              : state === "unsupported"
                ? "No disponibles en este dispositivo."
                : state === "denied"
                  ? "Bloqueadas. Habilitalas en los ajustes del navegador."
                  : state === "on"
                    ? "Activadas. Te avisamos al reportar tu vehículo."
                    : "Recibí un aviso al instante cuando reportan tu vehículo."}
          </p>
        </div>
        {state === "on" ? (
          <span className="shrink-0 text-sm font-semibold text-green-600 dark:text-green-400">
            Activadas
          </span>
        ) : state === "off" ? (
          <button
            onClick={enable}
            disabled={busy}
            className="pressable shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60"
          >
            {busy ? "…" : "Activar"}
          </button>
        ) : null}
      </div>
    );
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
          className="pressable shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60"
        >
          {busy ? "…" : "Activar"}
        </button>
      </div>
    </div>
  );
}
