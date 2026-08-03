import { getTranslations } from "next-intl/server";
import IncidentModalRoute from "@/components/IncidentModalRoute";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("avisar") };
}

export default async function AvisarPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  return <IncidentModalRoute mode="alert" initialPatente={patente ?? ""} />;
}
