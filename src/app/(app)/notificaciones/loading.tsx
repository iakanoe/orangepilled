import { SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <header className="app-bar">
        <h1 className="app-title">Notificaciones</h1>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
