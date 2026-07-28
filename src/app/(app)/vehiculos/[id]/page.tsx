import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import VehicleForm from "@/components/VehicleForm";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/lib/types";

export const metadata = { title: "Editar vehículo" };

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!vehicle) notFound();

  return (
    <>
      <PageHeader title="Editar vehículo" />
      <VehicleForm ownerId={user.id} initial={vehicle as Vehicle} />
    </>
  );
}
