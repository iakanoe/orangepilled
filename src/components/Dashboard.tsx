"use client";

import { useMemo, useState } from "react";
import { ChevronRight, TriangleAlert, Car, Plus } from "lucide-react";
import Link from "@/components/Link";
import { formatPatente } from "@/lib/patente";
import UrgentAlerts from "@/components/UrgentAlerts";
import InstallPrompt from "@/components/InstallPrompt";
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
      <InstallPrompt />
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
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Estado de mis vehículos
          </h2>
          <Link
            href="/vehiculos"
            className="inline-flex items-center gap-0.5 rounded text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 active:text-brand-800 dark:hover:text-brand-400"
          >
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {vehicleStats.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {vehicleStats.map((s) => (
              <VehicleStatusCard key={s.vehicle.id} s={s} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center border-dashed p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <Car className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Todavía no registraste vehículos.
            </p>
            <Link href="/vehiculos/nuevo" className="btn btn-primary mt-4">
              <Plus className="h-4 w-4" aria-hidden />
              Agregar mi primer vehículo
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
      href={`/vehiculos/${s.vehicle.patente}`}
      className="card-interactive flex items-center gap-3 p-3"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-wide">
            {formatPatente(s.vehicle.patente)}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${st.badge}`}
          >
            {st.label}
          </span>
          {s.active > 0 && (
            <span
              title={`${s.active} alerta${s.active > 1 ? "s" : ""} en vivo`}
              className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
            >
              <TriangleAlert className="h-3 w-3" aria-hidden />
              {s.active > 1 ? s.active : ""}
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
      <ChevronRight
        className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600"
        aria-hidden
      />
    </Link>
  );
}
