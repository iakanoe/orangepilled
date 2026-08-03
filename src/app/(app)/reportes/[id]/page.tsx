import Link from "@/components/Link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";
import MiniMap from "@/components/MiniMap";
import PhotoGallery from "@/components/PhotoGallery";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import {
  incidentIcon,
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
  const Icon = incidentIcon(report.tipo);

  return (
    <>
      <header className="app-bar">
        <BackButton fallback="/" />
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="app-title truncate">{incidentLabel(report.tipo)}</h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {fmtDate(report.ocurrido_en)}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Patente */}
        <section className="card p-3">
          <p className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">
            Vehículo
          </p>
          {vehicle ? (
            <Link
              href={`/vehiculos/${report.patente}`}
              className="flex items-center justify-between"
            >
              <span className="font-mono text-lg font-bold tracking-wide">
                {formatPatente(report.patente)}
              </span>
              <span className="flex items-center gap-0.5 text-sm text-brand-600">
                {vehicle.alias || "Ver vehículo"}
                <ChevronRight className="h-4 w-4" aria-hidden />
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
          <section className="card p-3">
            <p className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              Severidad
            </p>
            <p className="text-sm font-semibold">
              {SEVERIDAD_LABELS[report.severidad] ??
                `Severidad ${report.severidad}`}
            </p>
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
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                {report.direccion}
              </p>
            )}
          </section>
        )}

        {/* Descripción */}
        {report.descripcion && (
          <section className="card p-3">
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
            <PhotoGallery
              photos={media.map((m) => ({ id: m.id, url: m.url }))}
            />
          </section>
        )}
      </div>
    </>
  );
}
