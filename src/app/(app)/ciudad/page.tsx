import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import CityView from "@/components/CityView";
import { startOfWindowBA } from "@/lib/city-status";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("ciudad") };
}

// Always fetch fresh city-wide numbers.
export const dynamic = "force-dynamic";

export default async function CiudadPage() {
  const supabase = await createClient();

  // Country-wide count of incidents over the last 7 calendar days + today.
  const { count } = await supabase
    .from("reports_heatmap")
    .select("*", { count: "exact", head: true })
    .gte("ocurrido_en", startOfWindowBA());

  return <CityView todayCount={count ?? 0} />;
}
