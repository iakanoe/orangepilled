import { Suspense } from "react";
import Link from "@/components/Link";
import { Plus, Car, TriangleAlert, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import VehicleStatusSummary from "@/components/VehicleStatusSummary";
import { computeVehicleStats, STATUS_STYLES } from "@/lib/vehicle-status";
import { SkeletonCard, SkeletonRow } from "@/components/Skeleton";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export const metadata = { title: "Mis vehículos" };

function VehiclesListSkeleton() {
  return (
    <>
      <section className="px-4 py-3">
        <SkeletonCard />
      </section>
      <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </>
  );
}

export default function VehiculosPage() {
  return (
    <>
      <header className="app-bar justify-between">
        <h1 className="app-title">Mis vehículos</h1>
        <Link href="/vehiculos/nuevo" className="btn btn-primary px-3 py-1.5">
          <Plus className="h-4 w-4" aria-hidden />
          Agregar
        </Link>
      </header>

      <Suspense fallback={<VehiclesListSkeleton />}>
        <VehiclesList />
      </Suspense>
    </>
  );
}

async function VehiclesList() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (vehicles ?? []) as Vehicle[];
  const patentes = [...new Set(list.map((v) => v.patente))];

  const [receivedRes, alertsRes] = await Promise.all([
    patentes.length
      ? supabase
          .from("reports")
          .select("*")
          .in("patente", patentes)
          .order("ocurrido_en", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Report[] }),
    patentes.length
      ? supabase
          .from("live_alerts")
          .select("*")
          .in("patente", patentes)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as LiveAlert[] }),
  ]);

  const received = (receivedRes.data ?? []) as Report[];
  const alerts = (alertsRes.data ?? []) as LiveAlert[];
  const stats = computeVehicleStats(list, received, alerts);
  const statById = new Map(stats.map((s) => [s.vehicle.id, s]));

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center p-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          <Car className="h-6 w-6" aria-hidden />
        </span>
        <p className="mt-3">
          Todavía no registraste vehículos.
          <br />
          Agregá uno para recibir reportes y avisos.
        </p>
        <Link href="/vehiculos/nuevo" className="btn btn-primary mt-4">
          <Plus className="h-4 w-4" aria-hidden />
          Agregar mi primer vehículo
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="px-4 py-3">
        <VehicleStatusSummary stats={stats} />
      </section>
      <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        {list.map((v) => (
          <li key={v.id}>
            <Link
              href={`/vehiculos/${v.patente}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800/50 dark:active:bg-gray-800"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  STATUS_STYLES[statById.get(v.id)?.status ?? "verde"].dot
                }`}
              />
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Car className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold tracking-wide">
                    {formatPatente(v.patente)}
                  </span>
                  {(statById.get(v.id)?.active ?? 0) > 0 && (
                    <span
                      title="Alerta en vivo activa"
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    >
                      <TriangleAlert className="h-3 w-3" aria-hidden />
                      {(statById.get(v.id)?.active ?? 0) > 1
                        ? statById.get(v.id)?.active
                        : ""}
                    </span>
                  )}
                </div>
                {v.alias && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {v.alias}
                  </p>
                )}
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
