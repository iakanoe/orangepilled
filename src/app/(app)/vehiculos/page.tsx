import Link from "@/components/Link";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import VehicleStatusSummary from "@/components/VehicleStatusSummary";
import { computeVehicleStats, STATUS_STYLES } from "@/lib/vehicle-status";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export const metadata = { title: "Mis vehículos" };

export default async function VehiculosPage() {
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

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-bold">Mis vehículos</h1>
        <Link
          href="/vehiculos/nuevo"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + Agregar
        </Link>
      </header>

      {list.length === 0 ? (
        <div className="flex flex-col items-center p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-3 text-4xl">🚗</p>
          Todavía no registraste vehículos.
          <br />
          Agregá uno para recibir reportes y avisos.
          <Link
            href="/vehiculos/nuevo"
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            + Agregar mi primer vehículo
          </Link>
        </div>
      ) : (
        <>
          <section className="px-4 py-3">
            <VehicleStatusSummary stats={stats} />
          </section>
          <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            {list.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/vehiculos/${v.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      STATUS_STYLES[statById.get(v.id)?.status ?? "verde"].dot
                    }`}
                  />
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-xl dark:bg-gray-800">
                    🚗
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold tracking-wide">
                        {formatPatente(v.patente)}
                      </span>
                      {(statById.get(v.id)?.active ?? 0) > 0 && (
                        <span
                          title="Alerta en vivo activa"
                          className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        >
                          ⚠️
                          {(statById.get(v.id)?.active ?? 0) > 1
                            ? ` ${statById.get(v.id)?.active}`
                            : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {v.alias || "Sin alias"}
                    </p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
