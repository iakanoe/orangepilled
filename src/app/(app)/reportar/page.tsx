import IncidentModalRoute from "@/components/IncidentModalRoute";

export const metadata = { title: "Reportar incidente" };

export default async function ReportarPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  return <IncidentModalRoute mode="report" initialPatente={patente ?? ""} />;
}
