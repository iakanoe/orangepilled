import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { Pencil, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";
import PullToRefresh from "@/components/PullToRefresh";
import VehicleAlerts from "@/components/VehicleAlerts";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePatente, formatPatente } from "@/lib/patente";
import {
  incidentIcon,
  incidentLabel,
  alertIcon,
  alertLabel,
  SEVERIDAD_LABELS,
} from "@/lib/incident-types";
import { isAlertActive } from "@/lib/alerts";
import {
  vehicleStatus,
  STATUS_STYLES,
  RECENT_DAYS,
  RED_THRESHOLD,
} from "@/lib/vehicle-status";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export const metadata = { title: "Vehículo" };

// Reports/alerts are shared data updated from any device, so never serve a
// stale prerendered copy — always query fresh on the server.
export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusDesc(recent: number): string {
  if (recent >= RED_THRESHOLD)
    return `${recent} reportes en los últimos ${RECENT_DAYS} días`;
  if (recent > 0)
    return `${recent} reporte${recent > 1 ? "s" : ""} en los últimos ${RECENT_DAYS} días`;
  return "Sin reportes recientes";
}

// One screen for both cases:
//  • "mine"     — the user tracks this plate: show alias, live alerts and the
//                 full history (reports + past alerts merged).
//  • "not mine" — any plate looked up from /consultar: a privileged,
//                 reports-only read limited to the last RECENT_DAYS, no alerts.
// The status color (scoring) is computed from recent reports in both cases.
export default async function VehiculoPage({
  params,
}: {
  params: Promise<{ patente: string }>;
}) {
  const { patente: raw } = await params;
  const parsed = parsePatente(decodeURIComponent(raw));
  if (!parsed.ok) notFound();
  const patente = parsed.normalized;

  const supabase = await createClient();
  const cutoff = Date.now() - RECENT_DAYS * 864e5;

  // Fire the owner-scoped reads together to avoid sequential round-trips. RLS
  // returns the vehicle only if it's the user's (the layout already gated
  // auth, so no extra getUser() is needed), and reports/alerts only for plates
  // they track — for a plate that isn't theirs these come back empty and are
  // discarded in favor of the privileged admin read below.
  const [vehicleRes, ownerReportsRes, ownerAlertsRes] = await Promise.all([
    supabase.from("vehicles").select("*").eq("patente", patente).maybeSingle(),
    supabase
      .from("reports")
      .select("*")
      .eq("patente", patente)
      .order("ocurrido_en", { ascending: false })
      .limit(200),
    supabase
      .from("live_alerts")
      .select("*")
      .eq("patente", patente)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const vehicle = (vehicleRes.data as Vehicle) ?? null;
  const mine = !!vehicle;

  let reports: Report[] = [];
  let alerts: LiveAlert[] = [];
  let recent: number;

  if (mine) {
    // Owner read via RLS: full history + live alerts.
    alerts = (ownerAlertsRes.data ?? []) as LiveAlert[];
    reports = (ownerReportsRes.data ?? []) as Report[];
    recent = reports.filter(
      (r) => new Date(r.ocurrido_en).getTime() >= cutoff,
    ).length;
  } else {
    // Not the user's plate: privileged, reports-only read limited to the
    // recent window. Live alerts belong to whoever registered the plate and
    // are never shown here.
    const admin = createAdminClient();
    const { data } = await admin
      .from("reports")
      .select("*")
      .eq("patente", patente)
      .gte("ocurrido_en", new Date(cutoff).toISOString())
      .order("ocurrido_en", { ascending: false })
      .limit(200);
    reports = (data ?? []) as Report[];
    recent = reports.length;
  }

  const status = vehicleStatus(recent);
  const st = STATUS_STYLES[status];

  // Merge reports with past alerts (mine only) into a single history feed.
  type HistoryItem =
    | { kind: "report"; date: string; report: Report }
    | { kind: "alert"; date: string; alert: LiveAlert };
  const pastAlerts = alerts.filter((a) => !isAlertActive(a));
  const history: HistoryItem[] = [
    ...reports.map((r): HistoryItem => ({
      kind: "report",
      date: r.ocurrido_en,
      report: r,
    })),
    ...pastAlerts.map((a): HistoryItem => ({
      kind: "alert",
      date: a.created_at,
      alert: a,
    })),
  ].sort((x, y) => (x.date < y.date ? 1 : -1));

  const subtitle = mine
    ? vehicle!.alias || "Tu vehículo"
    : "Informe del vehículo";

  return (
    <div>
      <header className="app-bar">
        <BackButton fallback={mine ? "/vehiculos" : "/consultar"} />
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-[17px] font-semibold leading-tight tracking-wide">
            {formatPatente(patente)}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        {mine ? (
          <Link
            href={`/vehiculos/${patente}/editar`}
            className="btn btn-outline shrink-0 px-3 py-1.5"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </Link>
        ) : (
          <span
            className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ${st.badge}`}
          >
            {st.label}
          </span>
        )}
      </header>

      <PullToRefresh>
        <div className="flex flex-col gap-4 p-4">
          {/* Active alerts — prominent, dismissable (own vehicles only) */}
          {mine && <VehicleAlerts initial={alerts} />}

          {/* Status / scoring — same color code used across the app */}
          <section
            className={`flex items-center gap-3 rounded-lg border bg-white p-4 dark:bg-gray-900 ${st.ring}`}
          >
            <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${st.dot}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{st.label}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {statusDesc(recent)}
              </p>
            </div>
          </section>

          {/* History — reports (+ past alerts when it's your vehicle) */}
          <section>
            <h2 className="mb-2 text-sm font-semibold">
              {mine ? "Historial" : "Historial de reportes"} ({history.length})
            </h2>
            {history.length ? (
              <ul className="flex flex-col gap-2">
                {history.map((item) =>
                  item.kind === "report" ? (
                    <ReportRow
                      key={`r-${item.report.id}`}
                      report={item.report}
                      linked={mine}
                    />
                  ) : (
                    <AlertRow key={`a-${item.alert.id}`} alert={item.alert} />
                  ),
                )}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                {mine
                  ? "Este vehículo todavía no tiene historial."
                  : "Esta patente todavía no tiene reportes recientes."}
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>
    </div>
  );
}

function ReportRow({ report, linked }: { report: Report; linked: boolean }) {
  const Icon = incidentIcon(report.tipo);
  const body = (
    <>
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{incidentLabel(report.tipo)}</p>
        {report.severidad != null && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {SEVERIDAD_LABELS[report.severidad] ??
              `Severidad ${report.severidad}`}
          </p>
        )}
        {report.descripcion && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {report.descripcion}
          </p>
        )}
        {report.direccion && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400 dark:text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {report.direccion}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
        {fmtDate(report.ocurrido_en)}
      </span>
    </>
  );
  const className =
    "flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900";
  return (
    <li>
      {linked ? (
        <Link href={`/reportes/${report.id}`} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </li>
  );
}

function AlertRow({ alert }: { alert: LiveAlert }) {
  const Icon = alertIcon(alert.tipo);
  return (
    <li className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
          {alertLabel(alert.tipo)}
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Alerta
          </span>
        </p>
        {alert.descripcion && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {alert.descripcion}
          </p>
        )}
        {alert.direccion && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400 dark:text-gray-500">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {alert.direccion}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
        {fmtDate(alert.created_at)}
      </span>
    </li>
  );
}
