"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Check } from "lucide-react";
import { parsePatente, formatPatente } from "@/lib/patente";
import { nativeNavigate } from "@/components/NativeTransitions";
import ConfirmDialog from "@/components/ConfirmDialog";
import { saveVehicle, deleteVehicle } from "@/app/(app)/vehiculos/actions";
import type { Vehicle } from "@/lib/types";

export default function VehicleForm({ initial }: { initial?: Vehicle }) {
  const router = useRouter();
  const editing = !!initial;

  const [patente, setPatente] = useState(initial?.patente ?? "");
  const [alias, setAlias] = useState(initial?.alias ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const parsed = parsePatente(patente);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ok) return setError("Patente inválida");
    setBusy(true);
    setError(null);

    // Server Action: mutates via RLS and revalidates the list/dashboard so the
    // client Router Cache no longer serves a stale list after navigating.
    const res = await saveVehicle({
      id: initial?.id,
      patente: parsed.normalized,
      alias,
    });

    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    track(editing ? "vehicle_updated" : "vehicle_added");
    // After editing go back to the vehicle summary; after creating, to the list.
    nativeNavigate("forward", () =>
      router.push(editing ? `/vehiculos/${res.patente}` : "/vehiculos"),
    );
  }

  async function remove() {
    if (!initial) return;
    setBusy(true);
    setError(null);
    const res = await deleteVehicle(initial.id);
    if (!res.ok) {
      setBusy(false);
      setConfirmRemove(false);
      setError(res.error);
      return;
    }
    track("vehicle_removed");
    nativeNavigate("back", () => router.push("/vehiculos"));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <div>
        <label className="field-label">Patente *</label>
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder="AB123CD"
          className={`input font-mono text-lg tracking-wider ${
            patente && !parsed.ok
              ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
              : ""
          }`}
        />
        {parsed.ok && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-green-600">
            {formatPatente(patente)}
            <Check className="h-3.5 w-3.5" aria-hidden />
          </p>
        )}
      </div>

      <div>
        <label className="field-label">Alias</label>
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="El auto de mamá"
          className="input"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
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
        className="btn btn-primary"
      >
        {busy ? "Guardando…" : editing ? "Guardar cambios" : "Agregar vehículo"}
      </button>

      {editing && (
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          disabled={busy}
          className="rounded-lg py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:opacity-50 dark:hover:bg-red-950/40 dark:active:bg-red-950/70"
        >
          Quitar de mi cuenta
        </button>
      )}

      <ConfirmDialog
        open={confirmRemove}
        danger
        busy={busy}
        title="Quitar vehículo"
        message="¿Quitar este vehículo de tu cuenta? Sus reportes y avisos no se borran; solo dejarás de seguirlo."
        confirmLabel="Quitar"
        onConfirm={remove}
        onCancel={() => setConfirmRemove(false)}
      />
    </form>
  );
}
