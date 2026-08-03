import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

export default async function Loading() {
  const t = await getTranslations("meta");
  return (
    <div>
      <PageHeader title={t("editarVehiculo")} />
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
