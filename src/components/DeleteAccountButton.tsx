"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "idle" | "confirm" | "reconfirm";

export default function DeleteAccountButton({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (loading) return;
    setStep("idle");
    setTyped("");
    setError(null);
  }

  const emailMatches = typed.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete() {
    if (!emailMatches) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: typed.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo borrar la cuenta");
      }
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="pressable w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 dark:active:bg-red-950/70"
      >
        Borrar mi cuenta
      </button>

      {step !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {step === "confirm" ? (
              <>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
                  Borrar mi cuenta
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Se eliminarán de forma permanente tu cuenta, tus vehículos,
                  reportes y notificaciones. Esta acción no se puede deshacer.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("reconfirm")}
                    className="pressable w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="pressable w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold transition-colors hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
                  Confirmá con tu correo
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Escribí{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {email}
                  </span>{" "}
                  para confirmar el borrado.
                </p>
                <input
                  type="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="tu@correo.com"
                  disabled={loading}
                  className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 dark:border-gray-700 dark:bg-gray-800"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!emailMatches || loading}
                    className="pressable w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
                  >
                    {loading ? "Borrando…" : "Borrar cuenta definitivamente"}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    disabled={loading}
                    className="pressable w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
