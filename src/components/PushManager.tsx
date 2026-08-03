"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { useTranslations } from "next-intl";
import { pushSupported, subscribeToPush } from "@/lib/push-client";

type State = "loading" | "unsupported" | "denied" | "off" | "on";

export default function PushManager({
  variant = "prompt",
}: {
  variant?: "prompt" | "settings";
}) {
  const t = useTranslations("push");
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  // Notifications are only offered once the app is installed as a PWA.
  const [standalone, setStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true,
    );
  }, []);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      // Use getRegistration() (resolves immediately, undefined if none) instead
      // of serviceWorker.ready, which never resolves when no SW is registered
      // (e.g. in dev, where /sw.js isn't emitted).
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return setState("unsupported");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      await subscribeToPush();
      track("push_enabled", { variant });
      setState("on");
    } catch (e) {
      setState(Notification.permission === "denied" ? "denied" : "off");
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Hide entirely until the app is installed as a PWA.
  if (standalone === null || !standalone) return null;

  // Settings variant: always render a status row so the surrounding card is
  // never empty (used in the configuración page).
  if (variant === "settings") {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{t("title")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {state === "loading"
              ? t("checking")
              : state === "unsupported"
                ? t("unsupported")
                : state === "denied"
                  ? t("deniedShort")
                  : state === "on"
                    ? t("onLong")
                    : t("offPrompt")}
          </p>
        </div>
        {state === "on" ? (
          <span className="shrink-0 text-sm font-semibold text-green-600 dark:text-green-400">
            {t("on")}
          </span>
        ) : state === "off" ? (
          <button
            onClick={enable}
            disabled={busy}
            className="btn btn-primary shrink-0 px-4 py-2"
          >
            {busy ? "…" : t("activate")}
          </button>
        ) : null}
      </div>
    );
  }

  // Nothing to show when push is unavailable or already enabled — the user
  // only needs this prompt when they haven't opted in yet.
  if (state === "loading" || state === "unsupported" || state === "on")
    return null;

  if (state === "denied") {
    return (
      <div className="mx-4 mb-2 card p-3">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t("deniedLong")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-2 card p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{t("title")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("offPrompt")}
          </p>
        </div>
        <button
          onClick={enable}
          disabled={busy}
          className="btn btn-primary shrink-0 px-4 py-2"
        >
          {busy ? "…" : t("activate")}
        </button>
      </div>
    </div>
  );
}
