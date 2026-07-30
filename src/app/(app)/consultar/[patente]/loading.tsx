import BackButton from "@/components/BackButton";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <BackButton fallback="/consultar" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-1 h-5 w-32" />
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Informe del vehículo
          </p>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </header>

      <div className="flex flex-col gap-4 p-4">
        <SkeletonCard />
        <Skeleton className="h-4 w-40" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
