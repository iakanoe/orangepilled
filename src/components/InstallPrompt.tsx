"use client";

import { CircleCheck, Download, Smartphone } from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";

// Android/desktop: fire the captured beforeinstallprompt.
// iOS Safari: no event — show Add-to-Home-Screen hint instead.
// Rendered inline at the top of the dashboard as a permanent, non-dismissable
// banner. Hidden only when the app is already running as an installed PWA.
export default function InstallPrompt() {
  const { standalone, isIos, installed, canInstall, install } =
    useInstallPrompt();

  // Hide while detecting or when already running as an installed PWA.
  if (standalone === null || standalone) return null;

  if (installed) {
    return (
      <div className="mx-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-900/60 dark:bg-brand-950/40">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
            <CircleCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">¡App instalada!</p>
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">
              Abrí{" "}
              <span className="font-medium">
                {process.env.NEXT_PUBLIC_APP_NAME}
              </span>{" "}
              desde el ícono en tu pantalla de inicio para usarla como app y
              recibir avisos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 card p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
          <Smartphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold">
            Instalá {process.env.NEXT_PUBLIC_APP_NAME}
          </p>
          {isIos ? (
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">
              Tocá <span className="font-medium">Compartir</span> y luego{" "}
              <span className="font-medium">Agregar a inicio</span>. Después
              abrila desde el ícono en tu pantalla de inicio.
            </p>
          ) : (
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">
              Accedé más rápido y recibí avisos con la app instalada.
            </p>
          )}
        </div>
        {!isIos && canInstall && (
          <button
            onClick={install}
            className="btn btn-primary shrink-0 self-center px-3 py-1.5"
          >
            <Download className="h-4 w-4" aria-hidden />
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}
