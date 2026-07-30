import { createClient } from "@/lib/supabase/server";
import PushManager from "@/components/PushManager";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-lg font-bold">Configuración</h1>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sesión iniciada como
          </p>
          <p className="font-medium">{user?.email}</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <ThemeToggle />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <PushManager variant="settings" />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Sobre la app
          </p>
          <p>
            {process.env.NEXT_PUBLIC_APP_NAME} — reportá incidentes y recibí
            avisos en vivo sobre vehículos por patente. Instalable como PWA.
          </p>
        </section>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-400"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}
