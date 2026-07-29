import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import PushManager from "@/components/PushManager";
import PullToRefresh from "@/components/PullToRefresh";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export const metadata = { title: "Inicio" };

export default async function HomePage() {
  const supabase = await createClient();

  const { data: vehiclesData } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const vehicles = (vehiclesData ?? []) as Vehicle[];
  const patentes = [...new Set(vehicles.map((v) => v.patente))];

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

  return (
    <>
      <header className="flex items-center justify-between bg-brand-600 px-4 pb-5 pt-6 text-white">
        <h1 className="text-xl font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-lg hover:bg-white/25"
        >
          👤
        </Link>
      </header>

      <PullToRefresh>
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <Link
            href="/reportar"
            className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <span className="text-2xl">📝</span>
            <span className="font-semibold">Reportar incidente</span>
            <span className="text-xs text-gray-500">
              Conducta de un vehículo
            </span>
          </Link>
          <Link
            href="/avisar"
            className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <span className="text-2xl">🚨</span>
            <span className="font-semibold">Avisar en vivo</span>
            <span className="text-xs text-gray-500">Problema en un ajeno</span>
          </Link>
        </div>

        {/* Push opt-in */}
        <PushManager />

        <Dashboard vehicles={vehicles} received={received} alerts={alerts} />
      </PullToRefresh>
    </>
  );
}
