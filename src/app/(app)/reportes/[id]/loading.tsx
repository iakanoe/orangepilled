import BackButton from "@/components/BackButton";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <header className="app-bar">
        <BackButton fallback="/" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-1 h-5 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <SkeletonCard />
        {/* Mapa */}
        <Skeleton className="h-40 w-full rounded-lg" />
        <SkeletonCard />
      </div>
    </div>
  );
}
