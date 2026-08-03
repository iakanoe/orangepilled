"use client";

import { useInstallPrompt } from "@/lib/use-install-prompt";
import PushManager from "@/components/PushManager";

// Configuración section that gates notifications behind installing the PWA.
// - Not installed: show an install prompt (or iOS/manual hint).
// - Installed: show the push-notification controls.
export default function SettingsNotifications() {
  const { standalone, isIos, installed, canInstall, install } =
    useInstallPrompt();

  if (standalone === null) return null; // detecting — avoid an empty card flash

  if (standalone) {
    return (
      <section className="card p-4">
        <PushManager variant="settings" />
      </section>
    );
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME;

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {installed ? "¡App instalada!" : `Instalá ${appName}`}
          </p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {installed
              ? `Abrí ${appName} desde el ícono en tu pantalla de inicio para activar las notificaciones.`
              : isIos
                ? "Instalá la app (Compartir → Agregar a inicio) para recibir avisos cuando reporten tu vehículo."
                : "Instalá la app para recibir avisos al instante cuando reporten tu vehículo."}
          </p>
        </div>
        {!isIos && !installed && canInstall && (
          <button
            onClick={install}
            className="btn btn-primary shrink-0 self-center px-4 py-2"
          >
            Instalar
          </button>
        )}
      </div>
    </section>
  );
}
