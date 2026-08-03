import { isAlertActive } from "@/lib/alerts";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

// Product tuning knobs live in @/config/thresholds; re-exported here so the
// status logic below (and its importers) keep reading naturally.
export { RECENT_DAYS, RED_THRESHOLD } from "@/config/thresholds";
import { RECENT_DAYS, RED_THRESHOLD } from "@/config/thresholds";

export type VehicleStatus = "verde" | "naranja" | "rojo";

export type VehicleStat = {
  vehicle: Vehicle;
  recent: number;
  total: number;
  active: number;
  last: string | null;
  status: VehicleStatus;
};

// Color status reflects the reports history only. Active live alerts are
// surfaced separately (a warning icon on the vehicle card), not by color.
export function vehicleStatus(recentReports: number): VehicleStatus {
  if (recentReports >= RED_THRESHOLD) return "rojo";
  if (recentReports > 0) return "naranja";
  return "verde";
}

export const STATUS_STYLES: Record<
  VehicleStatus,
  { dot: string; ring: string; badge: string; label: string }
> = {
  verde: {
    dot: "bg-emerald-500",
    ring: "border-emerald-200 dark:border-emerald-900",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    label: "Al día",
  },
  naranja: {
    dot: "bg-orange-500",
    ring: "border-orange-200 dark:border-orange-900",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    label: "Atención",
  },
  rojo: {
    dot: "bg-red-500",
    ring: "border-red-200 dark:border-red-900",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    label: "Riesgo",
  },
};

// Order used when displaying statuses grouped by color (most urgent first).
export const STATUS_ORDER: VehicleStatus[] = ["rojo", "naranja", "verde"];

// Human-readable description of the vehicle's reports status.
export function statusDescription(s: VehicleStat): string {
  if (s.recent >= RED_THRESHOLD) {
    return `${s.recent} reportes recientes`;
  }
  if (s.recent > 0) {
    return `${s.recent} reporte${s.recent > 1 ? "s" : ""} reciente${
      s.recent > 1 ? "s" : ""
    }`;
  }
  return "Sin reportes recientes";
}

// Builds per-vehicle status stats. `received` is expected to be ordered by
// ocurrido_en desc, so the first match per vehicle is its most recent report.
export function computeVehicleStats(
  vehicles: Vehicle[],
  received: Report[],
  alerts: LiveAlert[],
): VehicleStat[] {
  const cutoff = Date.now() - RECENT_DAYS * 864e5;
  return vehicles.map((v) => {
    const vReports = received.filter((r) => r.patente === v.patente);
    const recent = vReports.filter(
      (r) => new Date(r.ocurrido_en).getTime() >= cutoff,
    ).length;
    const active = alerts.filter(
      (a) => a.patente === v.patente && isAlertActive(a),
    ).length;
    return {
      vehicle: v,
      recent,
      total: vReports.length,
      active,
      last: vReports[0]?.ocurrido_en ?? null,
      status: vehicleStatus(recent),
    };
  });
}

// Counts vehicles per status, keyed by status.
export function summarizeByStatus(
  stats: VehicleStat[],
): Record<VehicleStatus, number> {
  const counts: Record<VehicleStatus, number> = {
    verde: 0,
    naranja: 0,
    rojo: 0,
  };
  for (const s of stats) counts[s.status] += 1;
  return counts;
}
