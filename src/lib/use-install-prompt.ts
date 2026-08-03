"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Shared PWA install state.
// - standalone: null while detecting, then whether the app runs as installed PWA.
// - canInstall: Android/desktop captured a beforeinstallprompt we can fire.
// - isIos: iOS Safari has no install event; the UI must show a manual hint.
// - installed: the app was installed during this session (appinstalled fired).
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setStandalone(isStandalone);
    if (isStandalone) return;

    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener("appinstalled", onInstalled);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    if (ios) {
      setIsIos(true);
      return () => window.removeEventListener("appinstalled", onInstalled);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    track("app_install_prompt", { outcome: choice.outcome });
    // `appinstalled` also flips `installed`, but set it here too for the case
    // where the event doesn't fire on some browsers.
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  return { standalone, isIos, installed, canInstall: !!deferred, install };
}
