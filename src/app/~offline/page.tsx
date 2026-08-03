import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("offline") };
}

export default async function OfflinePage() {
  const t = await getTranslations("offlinePage");
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          <WifiOff className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
          {t("body")}
        </p>
      </div>
    </main>
  );
}
