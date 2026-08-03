import { Suspense } from "react";
import Link from "@/components/Link";
import { Settings, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import QuickActions from "@/components/QuickActions";
import PushManager from "@/components/PushManager";
import PullToRefresh from "@/components/PullToRefresh";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import type { Vehicle, Report, LiveAlert } from "@/lib/types";

export const metadata = { title: "Inicio" };

async function DashboardData() {
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
    <Dashboard
      vehicles={vehicles}
      received={received}
      alerts={alerts}
      patentes={patentes}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <SkeletonCard />
      <Skeleton className="h-4 w-40" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <header className="app-bar justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <h1 className="app-title truncate">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h1>
        </div>
        <Link
          href="/configuracion"
          aria-label="Configuración"
          className="icon-btn -mr-1"
        >
          <Settings className="h-5 w-5" aria-hidden />
        </Link>
      </header>

      <PullToRefresh>
        {/* Quick actions */}
        <QuickActions />

        {/* Push opt-in */}
        <PushManager />

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardData />
        </Suspense>
      </PullToRefresh>
    </>
  );
}
