import Link from "@/components/Link";
import { Settings, ShieldCheck } from "lucide-react";
import QuickActions from "@/components/QuickActions";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
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

      <QuickActions />

      {/* Datos del dashboard cargando */}
      <div className="flex flex-col gap-3 p-4">
        <SkeletonCard />
        <Skeleton className="h-4 w-40" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
