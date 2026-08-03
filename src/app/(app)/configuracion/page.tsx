import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import SettingsNotifications from "@/components/SettingsNotifications";
import ThemeToggle from "@/components/ThemeToggle";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <PageHeader title="Configuración" />

      <div className="flex flex-col gap-4 p-4">
        <section className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sesión iniciada como
          </p>
          <p className="font-medium">{user?.email}</p>
        </section>

        <section className="card p-4">
          <ThemeToggle />
        </section>

        <SettingsNotifications />

        <section className="card p-4 text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Sobre la app
          </p>
          <p className="mb-2">
            {process.env.NEXT_PUBLIC_APP_NAME} es la app de la comunidad para
            cuidar el barrio entre todos. Avisá cuando pasa algo en tu zona y
            enterate al instante de lo que reportan los vecinos cerca tuyo.
          </p>
          <p>
            Cargá las patentes de tus vehículos y te avisamos si alguien reporta
            algo relacionado con ellos, para que puedas reaccionar a tiempo.
            Podés sumarla a tu pantalla de inicio para abrirla como cualquier
            otra app.
          </p>
        </section>

        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-danger w-full">
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </form>

        {user?.email && <DeleteAccountButton email={user.email} />}
      </div>
    </>
  );
}
