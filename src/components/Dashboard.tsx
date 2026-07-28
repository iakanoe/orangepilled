"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { formatPatente } from "@/lib/patente";
import {
  INCIDENT_TYPES,
  incidentEmoji,
  incidentLabel,
  alertEmoji,
  alertLabel,
} from "@/lib/incident-types";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";
import type { NamedCount } from "@/components/ReportCharts";

const TipoBarChart = dynamic(
  () => import("@/components/ReportCharts").then((m) => m.TipoBarChart),
  { ssr: false },
);
const TimelineChart = dynamic(
  () => import("@/components/ReportCharts").then((m) => m.TimelineChart),
  { ssr: false },
);

type Tab = "recibidos" | "hechos" | "avisos";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard({
  vehicles,
  received,
  made,
  alerts,
}: {
  vehicles: Vehicle[];
  received: Report[];
  made: Report[];
  alerts: LiveAlert[];
}) {
  const [tab, setTab] = useState<Tab>("recibidos");
  const [vehicleId, setVehicleId] = useState<string>("all");
  const [tipo, setTipo] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    return received.filter((r) => {
      if (vehicleId !== "all" && r.vehicle_id !== vehicleId) return false;
      if (tipo !== "all" && r.tipo !== tipo) return false;
      const d = dayKey(r.ocurrido_en);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [received, vehicleId, tipo, from, to]);

  const byTipo: NamedCount[] = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((r) => counts.set(r.tipo, (counts.get(r.tipo) ?? 0) + 1));
    return INCIDENT_TYPES.filter((t) => counts.has(t.value))
      .map((t) => ({ name: t.label, value: counts.get(t.value)! }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const timeline: NamedCount[] = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((r) => {
      const k = dayKey(r.ocurrido_en);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ name: k.slice(5), value: v }));
  }, [filtered]);

  const activeAlerts = alerts.filter((a) => a.estado === "activo");

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card label="Vehículos" value={vehicles.length} />
        <Card label="Reportes recibidos" value={received.length} />
        <Card label="Avisos activos" value={activeAlerts.length} accent="amber" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
          Filtros
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5"
          >
            <option value="all">Todos los vehículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {formatPatente(v.patente)}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5"
          >
            <option value="all">Todos los tipos</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-500">
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-500">
            Hasta
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1"
            />
          </label>
        </div>
      </div>

      {/* Charts */}
      <section className="rounded-xl border border-gray-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold">Reportes por tipo</h2>
        <TipoBarChart data={byTipo} />
      </section>
      <section className="rounded-xl border border-gray-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold">Evolución</h2>
        <TimelineChart data={timeline} />
      </section>

      {/* Activity tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        {(
          [
            ["recibidos", `Recibidos (${filtered.length})`],
            ["hechos", `Hechos (${made.length})`],
            ["avisos", `Avisos (${activeAlerts.length})`],
          ] as [Tab, string][]
        ).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-md py-1.5 font-medium ${
              tab === k ? "bg-white shadow-sm" : "text-gray-500"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {tab === "recibidos" &&
          (filtered.length ? (
            filtered.map((r) => (
              <ReportRow key={r.id} r={r} showPatente />
            ))
          ) : (
            <EmptyRow text="No hay reportes recibidos con estos filtros." />
          ))}
        {tab === "hechos" &&
          (made.length ? (
            made.map((r) => <ReportRow key={r.id} r={r} showPatente />)
          ) : (
            <EmptyRow text="Todavía no hiciste reportes." />
          ))}
        {tab === "avisos" &&
          (activeAlerts.length ? (
            activeAlerts.map((a) => <AlertRow key={a.id} a={a} />)
          ) : (
            <EmptyRow text="No hay avisos en vivo activos." />
          ))}
      </ul>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
      <div
        className={`text-2xl font-bold ${
          accent === "amber" ? "text-amber-500" : "text-brand-600"
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] leading-tight text-gray-500">{label}</div>
    </div>
  );
}

function ReportRow({ r, showPatente }: { r: Report; showPatente?: boolean }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <span className="text-xl">{incidentEmoji(r.tipo)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{incidentLabel(r.tipo)}</p>
        {showPatente && (
          <p className="font-mono text-xs text-gray-500">
            {formatPatente(r.patente)}
          </p>
        )}
        {r.descripcion && (
          <p className="truncate text-xs text-gray-500">{r.descripcion}</p>
        )}
      </div>
      <span className="shrink-0 text-[11px] text-gray-400">
        {fmtDate(r.ocurrido_en)}
      </span>
    </li>
  );
}

function AlertRow({ a }: { a: LiveAlert }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <span className="text-xl">{alertEmoji(a.tipo)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{alertLabel(a.tipo)}</p>
        <p className="font-mono text-xs text-gray-500">{formatPatente(a.patente)}</p>
        {a.descripcion && (
          <p className="truncate text-xs text-gray-500">{a.descripcion}</p>
        )}
      </div>
      <span className="shrink-0 text-[11px] text-gray-400">
        {fmtDate(a.created_at)}
      </span>
    </li>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <li className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
      {text}
    </li>
  );
}
