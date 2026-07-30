"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDeferredRealtime } from "@/lib/realtime";
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

export default function UrgentAlerts({
  initial,
  patentes,
  aliases,
  onDismiss,
}: {
  initial: LiveAlert[];
  patentes: string[];
  aliases: Record<string, string>;
  onDismiss?: (id: string) => void;
}) {
  // Keep a single client instance so the realtime channel is stable.
  const [supabase] = useState(() => createClient());
  const [alerts, setAlerts] = useState(() =>
    initial.filter((a) => isAlertActive(a)),
  );
  // Alerts the user dismissed locally, so a background refresh / realtime
  // event doesn't resurrect them before the DB update propagates.
  const dismissedRef = useRef<Set<string>>(new Set());
  const patenteSet = useMemo(() => new Set(patentes), [patentes]);

  // Re-sync whenever fresh server data arrives (e.g. after a push triggers
  // router.refresh): new alerts appear without needing a remount.
  useEffect(() => {
    setAlerts(
      initial.filter(
        (a) => isAlertActive(a) && !dismissedRef.current.has(a.id),
      ),
    );
  }, [initial]);

  // Realtime: a new alert on one of my plates shows up on its own, with no
  // refresh. RLS already limits what the browser receives; we also filter to
  // the plates shown on this dashboard. Deferred so a slow/failing websocket
  // never blocks the dashboard from opening.
  useDeferredRealtime(
    supabase,
    () =>
      supabase
        .channel("urgent-alerts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "live_alerts" },
          (payload) => {
            const a = payload.new as LiveAlert;
            if (
              !patenteSet.has(a.patente) ||
              dismissedRef.current.has(a.id) ||
              !isAlertActive(a)
            ) {
              return;
            }
            setAlerts((xs) =>
              xs.some((x) => x.id === a.id) ? xs : [a, ...xs],
            );
          },
        ),
    [supabase, patenteSet],
  );

  // Auto-deactivate: drop alerts once they age past the active window,
  // even if the user never dismisses them. Re-check periodically.
  useEffect(() => {
    const tick = () => setAlerts((xs) => xs.filter((a) => isAlertActive(a)));
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function dismiss(id: string) {
    dismissedRef.current.add(id);
    setAlerts((xs) => xs.filter((a) => a.id !== id));
    onDismiss?.(id);
    await supabase
      .from("live_alerts")
      .update({ estado: "resuelto" })
      .eq("id", id);
  }

  if (!alerts.length) return null;

  return (
    <section className="px-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
          Alertas urgentes
        </span>
        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
          {alerts.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40"
          >
            <span className="text-xl">{alertEmoji(a.tipo)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  {alertLabel(a.tipo)}
                </p>
                <span className="shrink-0 text-[11px] text-red-500 dark:text-red-400">
                  {fmt(a.created_at)}
                </span>
              </div>
              <p className="font-mono text-xs text-red-600 dark:text-red-400">
                {formatPatente(a.patente)}
                {aliases[a.patente] && (
                  <span className="ml-1 font-sans font-medium text-red-700 dark:text-red-300">
                    · {aliases[a.patente]}
                  </span>
                )}
              </p>
              {a.descripcion && (
                <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-300/80">
                  {a.descripcion}
                </p>
              )}
              {a.direccion && (
                <p className="mt-0.5 text-[11px] text-red-500 dark:text-red-400">
                  📍 {a.direccion}
                </p>
              )}
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
