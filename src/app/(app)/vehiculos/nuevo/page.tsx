import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import VehicleForm from "@/components/VehicleForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("agregarVehiculo") };
}

export default async function NuevoVehiculoPage() {
  const t = await getTranslations("meta");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader title={t("agregarVehiculo")} />
      <VehicleForm />
    </div>
  );
}
