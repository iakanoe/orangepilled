"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { track } from "@vercel/analytics";
import { useTranslations } from "next-intl";
import { nativeNavigate } from "@/components/NativeTransitions";

type Step = "idle" | "confirm" | "reconfirm";

export default function DeleteAccountButton({ email }: { email: string }) {
  const router = useRouter();
  const t = useTranslations("deleteAccount");
  const tc = useTranslations("common");
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
        throw new Error(data?.error ?? t("errorFailed"));
      }
      track("account_deleted");
      nativeNavigate("forward", () => router.replace("/login"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorUnexpected"));
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="btn btn-danger w-full"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {t("trigger")}
      </button>

      {step !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-pop dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {step === "confirm" ? (
              <>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
                  {t("title")}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {t("warning")}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("reconfirm")}
                    className="btn w-full bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
                  >
                    {tc("continuar")}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="btn btn-outline w-full"
                  >
                    {tc("cancelar")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
                  {t("confirmTitle")}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {t.rich("confirmBody", {
                    email,
                    b: (chunks) => (
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
                <input
                  type="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  disabled={loading}
                  className="input mt-3"
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
                    className="btn w-full bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50"
                  >
                    {loading ? t("deleting") : t("confirmDelete")}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    disabled={loading}
                    className="btn btn-outline w-full disabled:opacity-50"
                  >
                    {tc("cancelar")}
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
