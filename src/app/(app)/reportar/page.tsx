import PageHeader from "@/components/PageHeader";
import IncidentForm from "@/components/IncidentForm";

export const metadata = { title: "Reportar incidente" };

export default async function ReportarPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  return (
    <>
      <PageHeader
        title="Reportar incidente"
        subtitle="Sobre la conducta de un vehículo"
      />
      <IncidentForm mode="report" initialPatente={patente ?? ""} />
    </>
  );
}
