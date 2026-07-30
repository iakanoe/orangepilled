"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parsePatente, formatPatente } from "@/lib/patente";
import { nativeNavigate } from "@/components/NativeTransitions";
import type { Vehicle } from "@/lib/types";

export default function VehicleForm({
  ownerId,
  initial,
}: {
  ownerId: string;
  initial?: Vehicle;
}) {
  const router = useRouter();
  const supabase = createClient();
  const editing = !!initial;

  const [patente, setPatente] = useState(initial?.patente ?? "");
  const [alias, setAlias] = useState(initial?.alias ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parsePatente(patente);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ok) return setError("Patente inválida");
    setBusy(true);
    setError(null);

    const row = {
      owner_id: ownerId,
      patente: parsed.normalized,
      alias: alias || null,
    };

    const { error } = editing
      ? await supabase.from("vehicles").update(row).eq("id", initial!.id)
      : await supabase.from("vehicles").insert(row);

    setBusy(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "Ya agregaste esta patente a tu cuenta."
          : error.message,
      );
      return;
    }
    // After editing go back to the vehicle summary; after creating, to the list.
    nativeNavigate("forward", () =>
      router.push(editing ? `/vehiculos/${initial!.id}` : "/vehiculos"),
    );
    router.refresh();
  }

  async function remove() {
    if (!initial) return;
    if (
      !confirm(
        "¿Quitar este vehículo de tu cuenta? Sus reportes y avisos no se borran; solo dejarás de seguirlo.",
      )
    )
      return;
    setBusy(true);
    await supabase.from("vehicles").delete().eq("id", initial.id);
    nativeNavigate("back", () => router.push("/vehiculos"));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Patente *</label>
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder="AB123CD"
          className={`w-full rounded-lg border px-3 py-2.5 font-mono text-lg tracking-wider outline-none ${
            patente && !parsed.ok
              ? "border-red-400"
              : "border-gray-300 dark:border-gray-700"
          }`}
        />
        {parsed.ok && (
          <p className="mt-1 text-xs text-green-600">
            {formatPatente(patente)} ✓
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Alias</label>
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="El auto de mamá"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Solo vos ves este alias. Podés seguir cualquier patente, esté o no
          registrada por otra persona.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !parsed.ok}
        className="pressable rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50"
      >
        {busy ? "Guardando…" : editing ? "Guardar cambios" : "Agregar vehículo"}
      </button>

      {editing && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded-lg py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:opacity-50 dark:hover:bg-red-950/40 dark:active:bg-red-950/70"
        >
          Quitar de mi cuenta
        </button>
      )}
    </form>
  );
}
