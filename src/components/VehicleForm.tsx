"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { parsePatente, formatPatente } from "@/lib/patente";
import { nativeNavigate } from "@/components/NativeTransitions";
import ConfirmDialog from "@/components/ConfirmDialog";
import { saveVehicle, deleteVehicle } from "@/app/(app)/vehiculos/actions";
import type { Vehicle } from "@/lib/types";

export default function VehicleForm({ initial }: { initial?: Vehicle }) {
  const router = useRouter();
  const t = useTranslations("vehicleForm");
  const tc = useTranslations("common");
  const editing = !!initial;

  const [patente, setPatente] = useState(initial?.patente ?? "");
  const [alias, setAlias] = useState(initial?.alias ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const parsed = parsePatente(patente);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ok) return setError(t("invalidPatente"));
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
    // The launcher (vehicle detail for edit, list for create) is the previous
    // history entry, and revalidatePath already refreshed it — so pop back to
    // it instead of pushing/replacing, which would leave a duplicate entry that
    // makes the header back button appear to do nothing.
    const target = editing ? `/vehiculos/${res.patente}` : "/vehiculos";
    nativeNavigate("back", () => {
      if (window.history.length > 1) router.back();
      else router.replace(target);
    });
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
    // `replace` so back can't return to the deleted vehicle's form.
    nativeNavigate("back", () => router.replace("/vehiculos"));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <div>
        <label className="field-label">{t("patenteLabel")}</label>
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder={t("patentePlaceholder")}
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
        <label className="field-label">{t("aliasLabel")}</label>
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder={t("aliasPlaceholder")}
          className="input"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {t("aliasHelp")}
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
        {busy ? tc("guardando") : editing ? tc("guardar") : t("add")}
      </button>

      {editing && (
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          disabled={busy}
          className="rounded-lg py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:opacity-50 dark:hover:bg-red-950/40 dark:active:bg-red-950/70"
        >
          {t("removeFromAccount")}
        </button>
      )}

      <ConfirmDialog
        open={confirmRemove}
        danger
        busy={busy}
        title={t("removeTitle")}
        message={t("removeMessage")}
        confirmLabel={t("removeConfirm")}
        onConfirm={remove}
        onCancel={() => setConfirmRemove(false)}
      />
    </form>
  );
}
