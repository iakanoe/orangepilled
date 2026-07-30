"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPatente } from "@/lib/patente";
import UrgentAlerts from "@/components/UrgentAlerts";
import {
  STATUS_STYLES,
  computeVehicleStats,
  statusDescription,
  type VehicleStat,
} from "@/lib/vehicle-status";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export default function Dashboard({
  vehicles,
  received,
  alerts,
  patentes,
}: {
  vehicles: Vehicle[];
  received: Report[];
  alerts: LiveAlert[];
  patentes: string[];
}) {
  // Alerts the user dismissed locally, so both the urgent list and the
  // per-vehicle attention icon drop them immediately (before a server refresh).
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const activeAlerts = useMemo(
    () => alerts.filter((a) => !dismissed.has(a.id)),
    [alerts, dismissed],
  );

  const vehicleStats: VehicleStat[] = useMemo(
    () => computeVehicleStats(vehicles, received, activeAlerts),
    [vehicles, received, activeAlerts],
  );

  // Patente -> alias, so live alerts can name the car (first alias wins).
  const aliases = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of vehicles) {
      if (v.alias && !m[v.patente]) m[v.patente] = v.alias;
    }
    return m;
  }, [vehicles]);

  return (
    <div className="flex flex-col gap-4 py-4">
      <UrgentAlerts
        initial={alerts}
        patentes={patentes}
        aliases={aliases}
        onDismiss={(id) =>
          setDismissed((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          })
        }
      />
      <section className="px-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Estado de mis vehículos</h2>
          <Link
            href="/vehiculos"
            className="text-xs font-semibold text-brand-600"
          >
            Ver todos ›
          </Link>
        </div>
        {vehicleStats.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {vehicleStats.map((s) => (
              <VehicleStatusCard key={s.vehicle.id} s={s} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
            <p className="mb-2 text-3xl">🚗</p>
            Todavía no registraste vehículos.
            <Link
              href="/vehiculos/nuevo"
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              + Agregar mi primer vehículo
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function VehicleStatusCard({ s }: { s: VehicleStat }) {
  const st = STATUS_STYLES[s.status];
  return (
    <Link
      href={`/vehiculos/${s.vehicle.id}`}
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 dark:border-gray-800 dark:bg-gray-900 ${st.ring}`}
    >
      <span className={`h-3 w-3 shrink-0 rounded-full ${st.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-wide">
            {formatPatente(s.vehicle.patente)}
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${st.badge}`}
          >
            {st.label}
          </span>
          {s.active > 0 && (
            <span
              title={`${s.active} alerta${s.active > 1 ? "s" : ""} en vivo`}
              className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
            >
              ⚠️{s.active > 1 ? ` ${s.active}` : ""}
            </span>
          )}
        </div>
        {s.vehicle.alias && (
          <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
            {s.vehicle.alias}
          </p>
        )}
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {statusDescription(s)}
        </p>
      </div>
      <span className="text-gray-300 dark:text-gray-600">›</span>
    </Link>
  );
}
