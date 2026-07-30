import Link from "@/components/Link";
import QuickActions from "@/components/QuickActions";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-brand-700 bg-brand-600 px-4 py-3 text-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
        <h1 className="text-lg font-bold leading-tight">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <Link
          href="/configuracion"
          aria-label="Configuración"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-lg hover:bg-white/30 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          ⚙️
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
