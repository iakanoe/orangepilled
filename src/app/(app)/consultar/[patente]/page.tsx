import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import PullToRefresh from "@/components/PullToRefresh";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePatente, formatPatente } from "@/lib/patente";
import {
  incidentEmoji,
  incidentLabel,
  SEVERIDAD_LABELS,
} from "@/lib/incident-types";
import {
  vehicleStatus,
  STATUS_STYLES,
  RECENT_DAYS,
  RED_THRESHOLD,
} from "@/lib/vehicle-status";
import type { Report } from "@/lib/types";

export const metadata = { title: "Informe de patente" };

// Reports are shared data updated from any device, so never serve a stale
// prerendered copy — always query fresh on the server.
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

export default async function InformePatentePage({
  params,
}: {
  params: Promise<{ patente: string }>;
}) {
  const { patente: raw } = await params;
  const parsed = parsePatente(decodeURIComponent(raw));
  if (!parsed.ok) notFound();

  // Privileged, reports-only read: the plate is (usually) not one the user
  // tracks, so RLS would hide it. We deliberately query ONLY the reports
  // history here — live_alerts (urgent avisos) are never shown on this
  // screen; those belong to whoever registered the plate. The status color
  // is therefore computed from reports alone (never the "alerta activa"
  // amarillo state).
  const admin = createAdminClient();
  const { data } = await admin
    .from("reports")
    .select("*")
    .eq("patente", parsed.normalized)
    .order("ocurrido_en", { ascending: false })
    .limit(200);
  const reports = (data ?? []) as Report[];

  const cutoff = Date.now() - RECENT_DAYS * 864e5;
  const recent = reports.filter(
    (r) => new Date(r.ocurrido_en).getTime() >= cutoff,
  ).length;
  const status = vehicleStatus(recent);
  const st = STATUS_STYLES[status];

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <BackButton fallback="/consultar" />
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-lg font-bold leading-tight tracking-wide">
            {formatPatente(parsed.normalized)}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Informe del vehículo
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${st.badge}`}
        >
          {st.label}
        </span>
      </header>

      <PullToRefresh>
        <div className="flex flex-col gap-4 p-4">
          {/* Status — same color code used across the app */}
          <section
            className={`flex items-center gap-3 rounded-xl border bg-white p-4 dark:bg-gray-900 ${st.ring}`}
          >
            <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${st.dot}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{st.label}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {statusDesc(recent)}
              </p>
            </div>
          </section>

          {/* Reports history */}
          <section>
            <h2 className="mb-2 text-sm font-semibold">
              Historial de reportes ({reports.length})
            </h2>
            {reports.length ? (
              <ul className="flex flex-col gap-2">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <span className="text-xl">{incidentEmoji(r.tipo)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {incidentLabel(r.tipo)}
                      </p>
                      {r.severidad != null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {SEVERIDAD_LABELS[r.severidad] ??
                            `Severidad ${r.severidad}`}
                        </p>
                      )}
                      {r.descripcion && (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {r.descripcion}
                        </p>
                      )}
                      {r.direccion && (
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                          📍 {r.direccion}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                      {fmtDate(r.ocurrido_en)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                Esta patente todavía no tiene reportes.
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>
    </>
  );
}
