import { getTranslations } from "next-intl/server";
import { SkeletonCard } from "@/components/Skeleton";

export default async function Loading() {
  const t = await getTranslations("meta");
  return (
    <div>
      <header className="app-bar">
        <h1 className="app-title">{t("notificaciones")}</h1>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
