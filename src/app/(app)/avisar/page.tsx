import IncidentModalRoute from "@/components/IncidentModalRoute";

export const metadata = { title: "Avisar en vivo" };

export default async function AvisarPage({
  searchParams,
}: {
  searchParams: Promise<{ patente?: string }>;
}) {
  const { patente } = await searchParams;
  return <IncidentModalRoute mode="alert" initialPatente={patente ?? ""} />;
}
