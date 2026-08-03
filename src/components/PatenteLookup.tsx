"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parsePatente, formatPatente } from "@/lib/patente";
import { nativeNavigate } from "@/components/NativeTransitions";

// Search box for looking up the report history of any plate (not just your
// own vehicles). Navigates to /vehiculos/<normalized>; that page decides
// whether it's the user's vehicle or a privileged, reports-only lookup.
export default function PatenteLookup({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [patente, setPatente] = useState(initial);
  const parsed = parsePatente(patente);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ok) return;
    nativeNavigate("forward", () =>
      router.push(`/vehiculos/${encodeURIComponent(parsed.normalized)}`),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 p-4">
      <label className="text-sm font-medium">Patente</label>
      <div className="flex gap-2">
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder="AB123CD"
          inputMode="text"
          autoCapitalize="characters"
          className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 font-mono text-lg tracking-wider outline-none ${
            patente && !parsed.ok
              ? "border-red-400"
              : "border-gray-300 dark:border-gray-700"
          }`}
        />
        <button
          type="submit"
          disabled={!parsed.ok}
          className="pressable shrink-0 rounded-lg bg-brand-600 px-4 font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50"
        >
          Consultar
        </button>
      </div>
      {patente && !parsed.ok ? (
        <p className="text-xs text-red-500">Patente inválida</p>
      ) : parsed.ok ? (
        <p className="text-xs text-green-600">{formatPatente(patente)} ✓</p>
      ) : null}
    </form>
  );
}
