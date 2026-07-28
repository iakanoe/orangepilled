import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import PushManager from "@/components/PushManager";
import type { Vehicle, Report, LiveAlert, Profile } from "@/lib/types";

export const metadata = { title: "Inicio" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: vehiclesData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
    supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
  ]);

  const vehicles = (vehiclesData ?? []) as Vehicle[];
  const ids = vehicles.map((v) => v.id);

  const [receivedRes, madeRes, alertsRes] = await Promise.all([
    ids.length
      ? supabase
          .from("reports")
          .select("*")
          .in("vehicle_id", ids)
          .order("ocurrido_en", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Report[] }),
    supabase
      .from("reports")
      .select("*")
      .eq("reporter_id", user!.id)
      .order("ocurrido_en", { ascending: false })
      .limit(200),
    ids.length
      ? supabase
          .from("live_alerts")
          .select("*")
          .in("vehicle_id", ids)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as LiveAlert[] }),
  ]);

  const received = (receivedRes.data ?? []) as Report[];
  const made = (madeRes.data ?? []) as Report[];
  const alerts = (alertsRes.data ?? []) as LiveAlert[];
  const nombre = (profile as Profile | null)?.nombre;

  return (
    <>
      <header className="bg-brand-600 px-4 pb-5 pt-6 text-white">
        <p className="text-sm opacity-80">Hola{nombre ? `, ${nombre}` : ""} 👋</p>
        <h1 className="text-2xl font-bold">Alerta Patente</h1>
      </header>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <Link
          href="/reportar"
          className="flex flex-col gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
        >
          <span className="text-2xl">📝</span>
          <span className="font-semibold">Reportar incidente</span>
          <span className="text-xs text-gray-500">Conducta de un vehículo</span>
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
      <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white p-3">
        <PushManager />
      </div>

      <Dashboard
        vehicles={vehicles}
        received={received}
        made={made}
        alerts={alerts}
      />
    </>
  );
}
