"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { nativeNavigate } from "@/components/NativeTransitions";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const supabase = createClient();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link"
      ? "El enlace no es válido o ya venció. Pedí un código nuevo."
      : null,
  );

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const emailRedirectTo =
      typeof window !== "undefined"
        ? new URL(next, window.location.origin).toString()
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) return setError(error.message);
    nativeNavigate("forward", () => router.replace(next));
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white">
          <ShieldCheck className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Reportá y recibí avisos sobre patentes.
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <label className="field-label" htmlFor="email">
            Tu email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@email.com"
            className="input"
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Enviando…" : "Enviar código"}
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Te llega un email: tocá el enlace o ingresá el código de 6 dígitos.
          </p>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-3">
          <label className="field-label" htmlFor="code">
            Ingresá el código enviado a {email} (o tocá el enlace del email)
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="input text-center text-lg tracking-[0.3em]"
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Verificando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="text-center text-xs text-gray-400 underline dark:text-gray-500"
          >
            Cambiar email
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
