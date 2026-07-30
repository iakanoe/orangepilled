import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold">Perfil y configuración</h1>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sesión iniciada como</p>
          <Skeleton className="mt-1 h-5 w-48" />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          <p className="mb-1 font-medium text-gray-700">Sobre la app</p>
          <p>
            {process.env.NEXT_PUBLIC_APP_NAME} — reportá incidentes y recibí
            avisos en vivo sobre vehículos por patente. Instalable como PWA.
          </p>
        </section>

        <button
          type="button"
          className="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
