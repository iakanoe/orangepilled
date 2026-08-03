"use client";

import { useState } from "react";
import { MapPin, Siren } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { alertIcon, alertLabel } from "@/lib/incident-types";
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
  const t = useTranslations("vehicleAlerts");
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
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-400">
        <Siren className="h-4 w-4" aria-hidden />
        {t("activeTitle", { count: active.length })}
      </h2>
      <ul className="flex flex-col gap-2">
        {active.map((a) => {
          const Icon = alertIcon(a.tipo);
          return (
            <li
              key={a.id}
              className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/40"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
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
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-red-700/70 dark:text-red-400/70">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    {a.direccion}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-red-700/70 dark:text-red-400/70">
                  {fmtDate(a.created_at)}
                </p>
              </div>
              <button
                onClick={() => dismiss(a.id)}
                aria-label={t("dismissAria")}
                className="pressable shrink-0 rounded-md border border-red-200 bg-white/70 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-white active:bg-red-100 dark:border-red-800 dark:bg-white/10 dark:text-red-300 dark:hover:bg-white/20 dark:active:bg-white/25"
              >
                {t("dismiss")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
