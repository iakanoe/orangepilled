"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPatente } from "@/lib/patente";
import { alertEmoji, alertLabel } from "@/lib/incident-types";
import { isAlertActive } from "@/lib/alerts";
import type { LiveAlert } from "@/lib/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UrgentAlerts({ initial }: { initial: LiveAlert[] }) {
  const supabase = createClient();
  const [alerts, setAlerts] = useState(() =>
    initial.filter((a) => isAlertActive(a)),
  );

  // Auto-deactivate: drop alerts once they age past the active window,
  // even if the user never dismisses them. Re-check periodically.
  useEffect(() => {
    const tick = () => setAlerts((xs) => xs.filter((a) => isAlertActive(a)));
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function dismiss(id: string) {
    setAlerts((xs) => xs.filter((a) => a.id !== id));
    await supabase
      .from("live_alerts")
      .update({ estado: "resuelto" })
      .eq("id", id);
  }

  if (!alerts.length) return null;

  return (
    <section className="px-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-red-700">
          Alertas urgentes
        </span>
        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
          {alerts.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
          >
            <span className="text-xl">{alertEmoji(a.tipo)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-red-800">
                  {alertLabel(a.tipo)}
                </p>
                <span className="shrink-0 text-[11px] text-red-500">
                  {fmt(a.created_at)}
                </span>
              </div>
              <p className="font-mono text-xs text-red-600">
                {formatPatente(a.patente)}
              </p>
              {a.descripcion && (
                <p className="mt-0.5 text-xs text-red-700/80">
                  {a.descripcion}
                </p>
              )}
              {a.direccion && (
                <p className="mt-0.5 text-[11px] text-red-500">
                  📍 {a.direccion}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(a.id)}
              aria-label="Descartar alerta"
              className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 active:bg-white"
            >
              Descartar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
