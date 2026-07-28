import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPatente } from "@/lib/patente";
import type { Vehicle } from "@/lib/types";

export const metadata = { title: "Mis vehículos" };

export default async function VehiculosPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (vehicles ?? []) as Vehicle[];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">Mis vehículos</h1>
        <Link
          href="/vehiculos/nuevo"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + Agregar
        </Link>
      </header>

      {list.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          <p className="mb-3 text-4xl">🚗</p>
          Todavía no registraste vehículos.
          <br />
          Agregá uno para recibir reportes y avisos.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {list.map((v) => (
            <li key={v.id}>
              <Link
                href={`/vehiculos/${v.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-xl">
                  {v.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.foto_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    "🚗"
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold tracking-wide">
                      {formatPatente(v.patente)}
                    </span>
                    {v.verificado ? (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                        ✓ verificado
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        sin verificar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {[v.alias, v.marca, v.modelo].filter(Boolean).join(" · ") ||
                      (v.tipo === "flota" ? "Flota" : "Particular")}
                  </p>
                </div>
                <span className="text-gray-300">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
