"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "@/lib/leaflet-icon";

export default function MiniMapInner({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return (
    <div className="h-40 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
