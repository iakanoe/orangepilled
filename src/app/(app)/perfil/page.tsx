import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushManager from "@/components/PushManager";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  const p = profile as Profile | null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Perfil y configuración</h1>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sesión iniciada como</p>
          <p className="mb-3 font-medium">{user?.email}</p>
          <ProfileForm id={user!.id} initialNombre={p?.nombre ?? ""} />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <PushManager />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          <p className="mb-1 font-medium text-gray-700">Sobre la app</p>
          <p>
            Alerta Patente — reportá incidentes y recibí avisos en vivo sobre
            vehículos por patente. Instalable como PWA.
          </p>
        </section>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}
