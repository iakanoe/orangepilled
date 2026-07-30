"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { alertEmoji, alertLabel } from "@/lib/incident-types";
import { isAlertActive } from "@/lib/alerts";
import type { LiveAlert } from "@/lib/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VehicleAlerts({ initial }: { initial: LiveAlert[] }) {
  const [supabase] = useState(() => createClient());
  const [alerts, setAlerts] = useState(initial);

  async function dismiss(id: string) {
    setAlerts((xs) =>
      xs.map((a) => (a.id === id ? { ...a, estado: "resuelto" } : a)),
    );
    await supabase
      .from("live_alerts")
      .update({ estado: "resuelto" })
      .eq("id", id);
  }

  const active = alerts.filter((a) => isAlertActive(a));

  if (active.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-red-700">
        🚨 Alertas activas ({active.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {active.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40"
          >
            <span className="text-xl">{alertEmoji(a.tipo)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                {alertLabel(a.tipo)}
              </p>
              {a.descripcion && (
                <p className="text-xs text-red-800/80 dark:text-red-300/80">
                  {a.descripcion}
                </p>
              )}
              {a.direccion && (
                <p className="mt-0.5 truncate text-xs text-red-700/70 dark:text-red-400/70">
                  📍 {a.direccion}
                </p>
              )}
              <p className="mt-1 text-[11px] text-red-700/70 dark:text-red-400/70">
                {fmtDate(a.created_at)}
              </p>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              aria-label="Descartar alerta"
              className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 active:bg-white dark:bg-white/10 dark:text-red-300 dark:ring-red-800"
            >
              Descartar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
