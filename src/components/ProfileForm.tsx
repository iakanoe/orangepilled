"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  id,
  initialNombre,
}: {
  id: string;
  initialNombre: string;
}) {
  const supabase = createClient();
  const [nombre, setNombre] = useState(initialNombre);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    await supabase.from("profiles").update({ nombre }).eq("id", id);
    setBusy(false);
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setSaved(false);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : saved ? "✓" : "Guardar"}
      </button>
    </form>
  );
}
