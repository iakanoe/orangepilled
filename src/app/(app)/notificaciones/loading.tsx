import { SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold">Notificaciones</h1>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
