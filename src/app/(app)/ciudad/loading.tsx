import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="-mb-24 flex h-dvh flex-col overflow-hidden">
      {/* Same static header as the loaded view */}
      <header className="app-bar flex-col !items-start gap-0.5">
        <h1 className="app-title">Mapa general</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Incidentes en la última semana
        </p>
      </header>

      {/* Only the map is skeletonized */}
      <div className="min-h-0 flex-1">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </div>
  );
}
