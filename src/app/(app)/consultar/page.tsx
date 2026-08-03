import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import PatenteLookup from "@/components/PatenteLookup";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("consultar") };
}

export default async function ConsultarPage() {
  const t = await getTranslations("consultarPage");
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} back={false} />

      <PatenteLookup />

      <p className="px-4 text-sm text-gray-500 dark:text-gray-400">
        {t("help")}
      </p>
    </div>
  );
}
