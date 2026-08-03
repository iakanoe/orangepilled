"use client";

import { useTranslations } from "next-intl";
import CityMap from "@/components/CityMap";

export default function CityView({ todayCount }: { todayCount: number }) {
  const t = useTranslations("cityView");
  return (
    // -mb-24 cancels the app layout's pb-24 so the map reaches the fixed nav
    // instead of leaving a strip of empty space above it.
    <div className="-mb-24 flex h-dvh flex-col overflow-hidden">
      {/* Static header — stays visible while the map loads */}
      <header className="app-bar flex-col !items-start gap-0.5">
        <h1 className="app-title">{t("title")}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </header>

      {/* Map — fills the viewport down to the fixed nav */}
      <div className="relative min-h-0 flex-1">
        <CityMap />

        {/* Floating count pill, top-right over the map */}
        <div className="pointer-events-none absolute right-2 top-2 z-[400] flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow dark:bg-gray-900/90 dark:text-gray-200">
          <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
            {todayCount}
          </span>
          {t("countLabel")}
        </div>

        <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-2 z-[400] flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow dark:bg-gray-900/90 dark:text-gray-300">
          <span className="h-2 w-2 rounded-full bg-green-500" />{" "}
          {t("legendNone")}
          <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />{" "}
          {t("legendMany")}
        </div>
      </div>
    </div>
  );
}
