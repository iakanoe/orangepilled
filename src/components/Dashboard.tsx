"use client";

import { useMemo } from "react";
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
}: {
  vehicles: Vehicle[];
  received: Report[];
  alerts: LiveAlert[];
}) {
  const vehicleStats: VehicleStat[] = useMemo(
    () => computeVehicleStats(vehicles, received, alerts),
    [vehicles, received, alerts],
  );

  return (
    <div className="flex flex-col gap-4 py-4">
      <UrgentAlerts initial={alerts} />
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
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
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
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${st.ring}`}
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
        </div>
        {s.vehicle.alias && (
          <p className="truncate text-xs font-medium text-gray-700">
            {s.vehicle.alias}
          </p>
        )}
        <p className="truncate text-xs text-gray-500">{statusDescription(s)}</p>
      </div>
      <span className="text-gray-300">›</span>
    </Link>
  );
}
