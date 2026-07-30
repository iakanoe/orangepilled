import Link from "@/components/Link";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import VehicleAlerts from "@/components/VehicleAlerts";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import {
  incidentEmoji,
  incidentLabel,
  alertEmoji,
  alertLabel,
  SEVERIDAD_LABELS,
} from "@/lib/incident-types";
import { isAlertActive } from "@/lib/alerts";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export const metadata = { title: "Vehículo" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function VehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vehicleData } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!vehicleData) notFound();
  const vehicle = vehicleData as Vehicle;

  const [alertsRes, reportsRes] = await Promise.all([
    supabase
      .from("live_alerts")
      .select("*")
      .eq("patente", vehicle.patente)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("reports")
      .select("*")
      .eq("patente", vehicle.patente)
      .order("ocurrido_en", { ascending: false })
      .limit(200),
  ]);

  const alerts = (alertsRes.data ?? []) as LiveAlert[];
  const reports = (reportsRes.data ?? []) as Report[];

  // Only active alerts are prominent; past alerts get merged into the history.
  const pastAlerts = alerts.filter((a) => !isAlertActive(a));
  type HistoryItem =
    | { kind: "report"; date: string; report: Report }
    | { kind: "alert"; date: string; alert: LiveAlert };
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

  const subtitle = vehicle.alias || "Sin alias";

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <BackButton fallback="/vehiculos" />
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-lg font-bold leading-tight tracking-wide">
            {formatPatente(vehicle.patente)}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        <Link
          href={`/vehiculos/${id}/editar`}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
        >
          Editar
        </Link>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Active alerts — prominent, dismissable */}
        <VehicleAlerts initial={alerts} />

        {/* Historial — reports + past alerts merged, newest first */}
        <section>
          <h2 className="mb-2 text-sm font-semibold">
            Historial ({history.length})
          </h2>
          {history.length ? (
            <ul className="flex flex-col gap-2">
              {history.map((item) =>
                item.kind === "report" ? (
                  <li key={`r-${item.report.id}`}>
                    <Link
                      href={`/reportes/${item.report.id}`}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <span className="text-xl">
                        {incidentEmoji(item.report.tipo)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {incidentLabel(item.report.tipo)}
                        </p>
                        {item.report.severidad != null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {SEVERIDAD_LABELS[item.report.severidad] ??
                              `Severidad ${item.report.severidad}`}
                          </p>
                        )}
                        {item.report.descripcion && (
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {item.report.descripcion}
                          </p>
                        )}
                        {item.report.direccion && (
                          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                            📍 {item.report.direccion}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                        {fmtDate(item.report.ocurrido_en)}
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li
                    key={`a-${item.alert.id}`}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="text-xl opacity-60">
                      {alertEmoji(item.alert.tipo)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {alertLabel(item.alert.tipo)}
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          Alerta
                        </span>
                      </p>
                      {item.alert.descripcion && (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {item.alert.descripcion}
                        </p>
                      )}
                      {item.alert.direccion && (
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          📍 {item.alert.direccion}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                      {fmtDate(item.alert.created_at)}
                    </span>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
              Este vehículo todavía no tiene historial.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
