import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import VehicleForm from "@/components/VehicleForm";
import { createClient } from "@/lib/supabase/server";
import { parsePatente } from "@/lib/patente";
import type { Vehicle } from "@/lib/types";

export const metadata = { title: "Editar vehículo" };

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ patente: string }>;
}) {
  const { patente: raw } = await params;
  const parsed = parsePatente(decodeURIComponent(raw));
  if (!parsed.ok) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("patente", parsed.normalized)
    .maybeSingle();

  if (!vehicle) notFound();

  return (
    <>
      <PageHeader title="Editar vehículo" />
      <VehicleForm initial={vehicle as Vehicle} />
    </>
  );
}
