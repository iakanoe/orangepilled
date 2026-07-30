import BackButton from "@/components/BackButton";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <BackButton fallback="/vehiculos" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-1 h-5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-lg" />
      </header>

      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-4 w-32" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
