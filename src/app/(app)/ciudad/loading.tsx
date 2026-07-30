import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="-mb-24 flex h-dvh flex-col overflow-hidden">
      {/* Same static header as the loaded view */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold leading-tight">Mapa general</h1>
        <p className="text-xs text-gray-500">Incidentes en la última semana</p>
      </header>

      {/* Only the map is skeletonized */}
      <div className="min-h-0 flex-1">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </div>
  );
}
