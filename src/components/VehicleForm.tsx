"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";
import { parsePatente, formatPatente } from "@/lib/patente";
import type { Vehicle, VehicleTipo } from "@/lib/types";

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
  const [marca, setMarca] = useState(initial?.marca ?? "");
  const [modelo, setModelo] = useState(initial?.modelo ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [anio, setAnio] = useState<string>(initial?.anio?.toString() ?? "");
  const [tipo, setTipo] = useState<VehicleTipo>(initial?.tipo ?? "particular");
  const [foto, setFoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parsePatente(patente);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ok) return setError("Patente inválida");
    setBusy(true);
    setError(null);

    let foto_url = initial?.foto_url ?? null;
    if (foto) {
      try {
        foto_url = await uploadImage(foto, "vehicles");
      } catch {
        /* keep existing / null on failure */
      }
    }

    const row = {
      owner_id: ownerId,
      patente: parsed.normalized,
      alias: alias || null,
      marca: marca || null,
      modelo: modelo || null,
      color: color || null,
      anio: anio ? parseInt(anio, 10) : null,
      tipo,
      foto_url,
    };

    const { error } = editing
      ? await supabase.from("vehicles").update(row).eq("id", initial!.id)
      : await supabase.from("vehicles").insert(row);

    setBusy(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "Esa patente ya está registrada."
          : error.message,
      );
      return;
    }
    router.push("/vehiculos");
    router.refresh();
  }

  async function remove() {
    if (!initial) return;
    if (!confirm("¿Eliminar este vehículo?")) return;
    setBusy(true);
    await supabase.from("vehicles").delete().eq("id", initial.id);
    router.push("/vehiculos");
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
            patente && !parsed.ok ? "border-red-400" : "border-gray-300"
          }`}
        />
        {parsed.ok && (
          <p className="mt-1 text-xs text-green-600">{formatPatente(patente)} ✓</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Alias" value={alias} onChange={setAlias} placeholder="El auto de mamá" />
        <Field label="Color" value={color} onChange={setColor} />
        <Field label="Marca" value={marca} onChange={setMarca} />
        <Field label="Modelo" value={modelo} onChange={setModelo} />
        <Field label="Año" value={anio} onChange={setAnio} type="number" />
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as VehicleTipo)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="particular">Particular</option>
            <option value="flota">Flota (empresa)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Foto del vehículo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
        />
      </div>

      {editing && !initial?.verificado && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Este vehículo aún no está verificado. La verificación de titularidad
          (para que sólo el dueño vea los reportes) llega en una próxima versión.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy || !parsed.ok}
        className="rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Guardando…" : editing ? "Guardar cambios" : "Agregar vehículo"}
      </button>

      {editing && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="py-2 text-sm font-medium text-red-600"
        >
          Eliminar vehículo
        </button>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
      />
    </div>
  );
}
