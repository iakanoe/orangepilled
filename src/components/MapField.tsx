"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "@/components/MapPicker";

// Leaflet touches `window`, so the picker must never render on the server.
const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 place-items-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-500">
      Cargando mapa…
    </div>
  ),
});

export default function MapField(props: {
  value: LatLng | null;
  onChange: (v: LatLng, direccion: string | null) => void;
}) {
  return <MapPicker {...props} />;
}
