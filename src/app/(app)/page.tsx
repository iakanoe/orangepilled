import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import QuickActions from "@/components/QuickActions";
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
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-bold leading-tight">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-lg hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          👤
        </Link>
      </header>

      <PullToRefresh>
        {/* Quick actions */}
        <QuickActions />

        {/* Push opt-in */}
        <PushManager />

        <Dashboard
          vehicles={vehicles}
          received={received}
          alerts={alerts}
          patentes={patentes}
        />
      </PullToRefresh>
    </>
  );
}
