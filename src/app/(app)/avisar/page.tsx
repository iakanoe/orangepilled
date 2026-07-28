import PageHeader from "@/components/PageHeader";
import IncidentForm from "@/components/IncidentForm";

export const metadata = { title: "Avisar en vivo" };

export default async function AvisarPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  return (
    <>
      <PageHeader
        title="Avisar en vivo"
        subtitle="Detectaste un problema en un vehículo ajeno"
      />
      <IncidentForm mode="alert" initialPatente={patente ?? ""} />
    </>
  );
}
