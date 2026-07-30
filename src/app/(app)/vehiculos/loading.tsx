import Link from "next/link";
import { SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-bold">Mis vehículos</h1>
        <Link
          href="/vehiculos/nuevo"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + Agregar
        </Link>
      </header>

      <section className="px-4 py-3">
        <SkeletonCard />
      </section>
      <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </>
  );
}
