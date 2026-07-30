"use client";

import CityMap from "@/components/CityMap";

export default function CityView({ todayCount }: { todayCount: number }) {
  return (
    // -mb-24 cancels the app layout's pb-24 so the map reaches the fixed nav
    // instead of leaving a strip of empty space above it.
    <div className="-mb-24 flex h-dvh flex-col overflow-hidden">
      {/* Compact header + today's count */}
      <header className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
        <div>
          <h1 className="text-lg font-bold leading-tight">Mapa general</h1>
          <p className="text-xs text-white/70">Incidentes reportados hoy</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none">{todayCount}</p>
          <p className="text-[11px] text-white/70">hoy</p>
        </div>
      </header>

      {/* Map — fills the viewport down to the fixed nav */}
      <div className="relative min-h-0 flex-1">
        <CityMap />
        <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-2 z-[400] flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow">
          <span className="h-2 w-2 rounded-full bg-green-500" /> sin incidentes
          <span className="ml-1 h-2 w-2 rounded-full bg-red-500" /> muchos
        </div>
      </div>
    </div>
  );
}
