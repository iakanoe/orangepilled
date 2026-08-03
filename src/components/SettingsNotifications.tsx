"use client";

import { useTranslations } from "next-intl";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import PushManager from "@/components/PushManager";
import { APP_NAME } from "@/config/app";

// Configuración section that gates notifications behind installing the PWA.
// - Not installed: show an install prompt (or iOS/manual hint).
// - Installed: show the push-notification controls.
export default function SettingsNotifications() {
  const { standalone, isIos, installed, canInstall, install } =
    useInstallPrompt();
  const t = useTranslations("install");

  if (standalone === null) return null; // detecting — avoid an empty card flash

  if (standalone) {
    return (
      <section className="card p-4">
        <PushManager variant="settings" />
      </section>
    );
  }

  const appName = APP_NAME;

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {installed ? t("installed") : t("installCta", { appName })}
          </p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {installed
              ? t("installedNotif", { appName })
              : isIos
                ? t("iosNotifHint")
                : t("androidNotifHint")}
          </p>
        </div>
        {!isIos && !installed && canInstall && (
          <button
            onClick={install}
            className="btn btn-primary shrink-0 self-center px-4 py-2"
          >
            {t("installButton")}
          </button>
        )}
      </div>
    </section>
  );
}
