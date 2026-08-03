import PageHeader from "@/components/PageHeader";
import PatenteLookup from "@/components/PatenteLookup";

export const metadata = { title: "Consultar patente" };

export default function ConsultarPage() {
  return (
    <div>
      <PageHeader
        title="Consultar patente"
        subtitle="Historial de reportes de un vehículo ajeno"
        back={false}
      />

      <PatenteLookup />

      <p className="px-4 text-sm text-gray-500 dark:text-gray-400">
        Ingresá una patente para ver su informe. Solo se muestra el historial de
        reportes; los avisos urgentes solo los recibe quien tenga el vehículo
        registrado.
      </p>
    </div>
  );
}
