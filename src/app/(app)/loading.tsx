import Link from "next/link";
import QuickActions from "@/components/QuickActions";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold leading-tight">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-lg hover:bg-gray-200"
        >
          👤
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
