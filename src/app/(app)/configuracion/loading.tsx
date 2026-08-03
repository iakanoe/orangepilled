import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <header className="app-bar">
        <h1 className="app-title">Configuración</h1>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <section className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sesión iniciada como
          </p>
          <Skeleton className="mt-1 h-5 w-48" />
        </section>

        <section className="card p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </section>

        <section className="card p-4 text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Sobre la app
          </p>
          <p>
            {process.env.NEXT_PUBLIC_APP_NAME} — reportá incidentes y recibí
            avisos en vivo sobre vehículos por patente. Instalable como PWA.
          </p>
        </section>

        <div className="btn btn-danger w-full">Cerrar sesión</div>
      </div>
    </>
  );
}
