import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import {
  incidentEmoji,
  incidentLabel,
  alertEmoji,
  alertLabel,
  SEVERIDAD_LABELS,
} from "@/lib/incident-types";
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
      .eq("estado", "activo")
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("*")
      .eq("patente", vehicle.patente)
      .order("ocurrido_en", { ascending: false })
      .limit(200),
  ]);

  const alerts = (alertsRes.data ?? []) as LiveAlert[];
  const reports = (reportsRes.data ?? []) as Report[];

  const subtitle = vehicle.alias || "Sin alias";

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <BackButton fallback="/vehiculos" />
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-lg font-bold leading-tight tracking-wide">
            {formatPatente(vehicle.patente)}
          </h1>
          <p className="truncate text-xs text-gray-500">{subtitle}</p>
        </div>
        <Link
          href={`/vehiculos/${id}/editar`}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700"
        >
          Editar
        </Link>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Active alerts — prominent */}
        {alerts.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-amber-700">
              🚨 Alertas activas ({alerts.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3"
                >
                  <span className="text-xl">{alertEmoji(a.tipo)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {alertLabel(a.tipo)}
                    </p>
                    {a.descripcion && (
                      <p className="text-xs text-amber-800/80">
                        {a.descripcion}
                      </p>
                    )}
                    {a.direccion && (
                      <p className="mt-0.5 truncate text-xs text-amber-700/70">
                        📍 {a.direccion}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-amber-700/70">
                    {fmtDate(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reports history */}
        <section>
          <h2 className="mb-2 text-sm font-semibold">
            Historial de reportes ({reports.length})
          </h2>
          {reports.length ? (
            <ul className="flex flex-col gap-2">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/reportes/${r.id}`}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <span className="text-xl">{incidentEmoji(r.tipo)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {incidentLabel(r.tipo)}
                      </p>
                      {r.severidad != null && (
                        <p className="text-xs text-gray-500">
                          {SEVERIDAD_LABELS[r.severidad] ??
                            `Severidad ${r.severidad}`}
                        </p>
                      )}
                      {r.descripcion && (
                        <p className="truncate text-xs text-gray-500">
                          {r.descripcion}
                        </p>
                      )}
                      {r.direccion && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          📍 {r.direccion}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {fmtDate(r.ocurrido_en)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              Este vehículo todavía no tiene reportes.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
