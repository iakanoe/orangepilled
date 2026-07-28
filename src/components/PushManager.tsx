"use client";

import { useEffect, useState } from "react";
import { pushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";

type State = "loading" | "unsupported" | "denied" | "off" | "on";

export default function PushManager() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const sub = await reg?.pushManager.getSubscription();
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

  async function disable() {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  if (state === "unsupported") {
    return (
      <p className="text-sm text-gray-500">
        Este navegador no soporta notificaciones push.
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-sm text-amber-600">
        Notificaciones bloqueadas. Habilitalas en los ajustes del navegador para
        recibir avisos sobre tus vehículos.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-medium">Notificaciones push</p>
        <p className="text-sm text-gray-500">
          {state === "on"
            ? "Activadas en este dispositivo."
            : "Recibí un aviso al instante cuando reportan tu vehículo."}
        </p>
      </div>
      <button
        onClick={state === "on" ? disable : enable}
        disabled={busy}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
          state === "on"
            ? "border border-gray-300 text-gray-700"
            : "bg-brand-600 text-white"
        }`}
      >
        {busy ? "…" : state === "on" ? "Desactivar" : "Activar"}
      </button>
    </div>
  );
}
