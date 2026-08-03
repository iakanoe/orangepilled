import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import VehicleForm from "@/components/VehicleForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Agregar vehículo" };

export default async function NuevoVehiculoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader title="Agregar vehículo" />
      <VehicleForm />
    </div>
  );
}
