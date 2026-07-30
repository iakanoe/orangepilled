"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Android/desktop: handle beforeinstallprompt.
// iOS Safari: no event — show Add-to-Home-Screen hint instead.
// Rendered inline at the top of the dashboard as a permanent, non-dismissable
// banner. Hidden only when the app is already running as an installed PWA.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    if (ios) {
      setIsIos(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    }
    setDeferred(null);
  }

  if (!show) return null;

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
              <span className="font-medium">Agregar a inicio</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">
              Accedé más rápido y recibí avisos con la app instalada.
            </p>
          )}
        </div>
        {!isIos && (
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
