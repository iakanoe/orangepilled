"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Check, Search } from "lucide-react";
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
    track("patente_lookup");
    nativeNavigate("forward", () =>
      router.push(`/vehiculos/${encodeURIComponent(parsed.normalized)}`),
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 p-4">
      <label className="field-label">Patente</label>
      <div className="flex gap-2">
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder="AB123CD"
          inputMode="text"
          autoCapitalize="characters"
          className={`input min-w-0 flex-1 font-mono text-lg tracking-wider ${
            patente && !parsed.ok
              ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
              : ""
          }`}
        />
        <button
          type="submit"
          disabled={!parsed.ok}
          className="btn btn-primary shrink-0"
        >
          <Search className="h-4 w-4" aria-hidden />
          Consultar
        </button>
      </div>
      {patente && !parsed.ok ? (
        <p className="text-xs text-red-500">Patente inválida</p>
      ) : parsed.ok ? (
        <p className="inline-flex items-center gap-1 text-xs text-green-600">
          {formatPatente(patente)}
          <Check className="h-3.5 w-3.5" aria-hidden />
        </p>
      ) : null}
    </form>
  );
}
