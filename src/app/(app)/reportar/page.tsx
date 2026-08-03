import { getTranslations } from "next-intl/server";
import IncidentModalRoute from "@/components/IncidentModalRoute";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("reportar") };
}

export default async function ReportarPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  return <IncidentModalRoute mode="report" initialPatente={patente ?? ""} />;
}
