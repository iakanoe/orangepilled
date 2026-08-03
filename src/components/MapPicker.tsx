"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import type L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "@/lib/leaflet-icon";
import { reverseGeocode, searchAddress } from "@/lib/geocode";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  value: LatLng | null;
  onChange: (v: LatLng, direccion: string | null) => void;
}

const DEFAULT_CENTER: LatLng = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires

function ClickHandler({ onPick }: { onPick: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center }: { center: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (center)
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 15));
  }, [center, map]);
  return null;
}

export default function MapPicker({ value, onChange }: Props) {
  const [flyTo, setFlyTo] = useState<LatLng | null>(value);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { lat: number; lng: number; label: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  const center = useMemo(() => value ?? DEFAULT_CENTER, [value]);

  async function pick(v: LatLng) {
    const direccion = await reverseGeocode(v.lat, v.lng).catch(() => null);
    onChange(v, direccion);
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const v = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFlyTo(v);
        pick(v);
      },
      () => alert("No pudimos obtener tu ubicación."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setResults(await searchAddress(query).catch(() => []));
    setSearching(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form onSubmit={runSearch} className="flex flex-1 gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dirección o cruce (ej: Callao y Corrientes)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <button
            type="submit"
            disabled={searching}
            className="pressable rounded-lg border border-gray-300 px-3 text-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-700"
          >
            {searching ? "…" : "Buscar"}
          </button>
        </form>
        <button
          type="button"
          onClick={locateMe}
          title="Usar mi ubicación"
          aria-label="Usar mi ubicación"
          className="pressable grid place-items-center rounded-lg bg-brand-600 px-3 text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {results.length > 0 && (
        <ul className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-800 dark:bg-gray-900">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  const v = { lat: r.lat, lng: r.lng };
                  setFlyTo(v);
                  onChange(v, r.label);
                  setResults([]);
                  setQuery(r.label);
                }}
                className="block w-full px-3 py-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="h-64 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 15 : 12}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          <Recenter center={flyTo} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend() {
                  const m = markerRef.current;
                  if (!m) return;
                  const p = m.getLatLng();
                  pick({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400">
        Tocá el mapa o arrastrá el pin para marcar el lugar.
      </p>
    </div>
  );
}
