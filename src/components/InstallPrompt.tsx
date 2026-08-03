"use client";

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
      <div className="mx-4 rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-sm dark:border-brand-900 dark:bg-brand-950">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-xl">
            ✅
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
    <div className="mx-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-xl">
          🚗
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
            className="pressable shrink-0 self-center rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
          >
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}
