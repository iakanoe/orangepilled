"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "install-dismissed";

// Android/desktop: handle beforeinstallprompt.
// iOS Safari: no event — show Add-to-Home-Screen hint instead.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

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

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-xl">
          🚗
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold">Instalá Alerta Patente</p>
          {isIos ? (
            <p className="mt-0.5 text-gray-500">
              Tocá <span className="font-medium">Compartir</span> y luego{" "}
              <span className="font-medium">Agregar a inicio</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-gray-500">
              Accedé más rápido y recibí avisos con la app instalada.
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={dismiss} className="px-3 py-1.5 text-sm text-gray-500">
          Ahora no
        </button>
        {!isIos && (
          <button
            onClick={install}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
          >
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}
