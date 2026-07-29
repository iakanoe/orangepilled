import { isAlertActive } from "@/lib/alerts";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

// A report counts as "recent" if it happened within this many days.
export const RECENT_DAYS = 30;
// Number of recent reports that escalates a vehicle from orange to red.
export const RED_THRESHOLD = 3;

export type VehicleStatus = "verde" | "naranja" | "rojo" | "amarillo";

export type VehicleStat = {
  vehicle: Vehicle;
  recent: number;
  total: number;
  active: number;
  last: string | null;
  status: VehicleStatus;
};

export function vehicleStatus(
  recentReports: number,
  activeAlerts: number,
): VehicleStatus {
  if (activeAlerts > 0) return "amarillo";
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
    ring: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Al día",
  },
  naranja: {
    dot: "bg-orange-500",
    ring: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    label: "Atención",
  },
  rojo: {
    dot: "bg-red-500",
    ring: "border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Riesgo",
  },
  amarillo: {
    dot: "bg-amber-400",
    ring: "border-amber-300",
    badge: "bg-amber-100 text-amber-700",
    label: "Alerta activa",
  },
};

// Order used when displaying statuses grouped by color (most urgent first).
export const STATUS_ORDER: VehicleStatus[] = [
  "amarillo",
  "rojo",
  "naranja",
  "verde",
];

// Human-readable description of what the vehicle's status means.
export function statusDescription(s: VehicleStat): string {
  if (s.active > 0) {
    return `${s.active} alerta${s.active > 1 ? "s" : ""} en vivo activa${
      s.active > 1 ? "s" : ""
    }`;
  }
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
      status: vehicleStatus(recent, active),
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
    amarillo: 0,
  };
  for (const s of stats) counts[s.status] += 1;
  return counts;
}
