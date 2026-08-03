import Link from "@/components/Link";
import { Plus } from "lucide-react";
import { SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="app-bar justify-between">
        <h1 className="app-title">Mis vehículos</h1>
        <Link href="/vehiculos/nuevo" className="btn btn-primary px-3 py-1.5">
          <Plus className="h-4 w-4" aria-hidden />
          Agregar
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
