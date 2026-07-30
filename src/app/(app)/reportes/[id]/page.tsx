import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/BackButton";
import MiniMap from "@/components/MiniMap";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import {
  incidentEmoji,
  incidentLabel,
  SEVERIDAD_LABELS,
} from "@/lib/incident-types";
import type { Report, MediaRow, Vehicle } from "@/lib/types";

export const metadata = { title: "Reporte" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReportePage({
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

  const { data: reportData } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!reportData) notFound();
  const report = reportData as Report;

  const [mediaRes, vehicleRes] = await Promise.all([
    supabase
      .from("media")
      .select("*")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("vehicles")
      .select("*")
      .eq("owner_id", user.id)
      .eq("patente", report.patente)
      .maybeSingle(),
  ]);

  const media = (mediaRes.data ?? []) as MediaRow[];
  const vehicle = vehicleRes.data as Vehicle | null;

  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <BackButton fallback="/" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">
            {incidentEmoji(report.tipo)} {incidentLabel(report.tipo)}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {fmtDate(report.ocurrido_en)}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Patente */}
        <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">
            Vehículo
          </p>
          {vehicle ? (
            <Link
              href={`/vehiculos/${vehicle.id}`}
              className="flex items-center justify-between"
            >
              <span className="font-mono text-lg font-bold tracking-wide">
                {formatPatente(report.patente)}
              </span>
              <span className="text-sm text-brand-600">
                {vehicle.alias || "Ver vehículo"} →
              </span>
            </Link>
          ) : (
            <span className="font-mono text-lg font-bold tracking-wide">
              {formatPatente(report.patente)}
            </span>
          )}
        </section>

        {/* Severidad */}
        {report.severidad != null && (
          <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              Severidad
            </p>
            <p className="text-sm font-semibold">
              {SEVERIDAD_LABELS[report.severidad] ??
                `Severidad ${report.severidad}`}
            </p>
          </section>
        )}

        {/* Descripción */}
        {report.descripcion && (
          <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              Descripción
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {report.descripcion}
            </p>
          </section>
        )}

        {/* Fotos */}
        {media.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500">
              Foto(s) ({media.length})
            </p>
            <div className="flex flex-col gap-2">
              {media.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.url}
                  alt="foto del reporte"
                  className="w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Ubicación */}
        {report.lat != null && report.lng != null && (
          <section>
            <p className="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500">
              Ubicación
            </p>
            <MiniMap lat={report.lat} lng={report.lng} />
            {report.direccion && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📍 {report.direccion}
              </p>
            )}
          </section>
        )}

        {/* Meta */}
        <section className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <p>Registrado el {fmtDate(report.created_at)}</p>
        </section>
      </div>
    </>
  );
}
