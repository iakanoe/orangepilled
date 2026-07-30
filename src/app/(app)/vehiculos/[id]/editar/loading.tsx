import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader title="Editar vehículo" />
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </>
  );
}
