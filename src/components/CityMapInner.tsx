"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import { createClient } from "@/lib/supabase/client";
import "@/lib/leaflet-icon";
import {
  CABA_BOUNDS,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  buildCells,
  cellSizeForZoom,
  heatColor,
  padBounds,
  startOfTodayBA,
  type Bounds,
  type Cell,
} from "@/lib/city-status";

type LatLng = { lat: number; lng: number };

// Frame the whole city on first load (until the device location kicks in).
const CABA_BBOX: LatLngBoundsExpression = [
  [CABA_BOUNDS.south, CABA_BOUNDS.west],
  [CABA_BOUNDS.north, CABA_BOUNDS.east],
];

export default function CityMapInner() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [pos, setPos] = useState<LatLng | null>(null);

  // Recenter on the known position; if we don't have one yet (or access was
  // denied), explicitly ask the browser for the location again.
  function recenter() {
    const map = mapRef.current;
    if (pos) {
      map?.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 14));
      return;
    }
    if (!navigator.geolocation) {
      alert("Tu dispositivo no permite compartir la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(c);
        mapRef.current?.setView([c.lat, c.lng], 14);
      },
      (err) => {
        alert(
          err.code === err.PERMISSION_DENIED
            ? "No tenemos acceso a tu ubicación. Activá los permisos de ubicación para este sitio y volvé a intentarlo."
            : "No pudimos obtener tu ubicación.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        bounds={CABA_BBOX}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={MAP_MAX_ZOOM}
        />
        <UserLocation pos={pos} onChange={setPos} />
        <HeatGrid />
      </MapContainer>

      <button
        type="button"
        onClick={recenter}
        aria-label="Centrar en mi ubicación"
        className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-3 z-[500] grid h-11 w-11 place-items-center rounded-full bg-white text-xl shadow-md ring-1 ring-black/5 active:scale-95"
      >
        📍
      </button>
    </div>
  );
}

// Tracks the device location: drops a blue dot and recenters once on the first
// fix. Keeps the CABA default if permission is denied or unavailable.
function UserLocation({
  pos,
  onChange,
}: {
  pos: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  const map = useMap();
  const centeredOnce = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        onChange(c);
        if (!centeredOnce.current) {
          centeredOnce.current = true;
          map.setView([c.lat, c.lng], 14);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [map, onChange]);

  if (!pos) return null;
  return (
    <CircleMarker
      center={[pos.lat, pos.lng]}
      radius={7}
      pathOptions={{
        color: "#fff",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 1,
      }}
    />
  );
}

// Fetches today's incidents for the visible area (plus padding) and paints a
// heat grid whose cell size scales with the zoom level. Re-runs on pan/zoom.
function HeatGrid() {
  const map = useMap();
  const supabase = useMemo(() => createClient(), []);
  const [cells, setCells] = useState<Cell[]>([]);
  const [max, setMax] = useState(0);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const reqId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refresh = useCallback(async () => {
    const b = map.getBounds();
    const padded = padBounds({
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    });
    const cell = cellSizeForZoom(map.getZoom());
    setBounds(padded);

    const id = ++reqId.current;
    const { data } = await supabase
      .from("reports_heatmap")
      .select("lat,lng")
      .gte("ocurrido_en", startOfTodayBA())
      .gte("lat", padded.south)
      .lte("lat", padded.north)
      .gte("lng", padded.west)
      .lte("lng", padded.east)
      .limit(10000);

    if (id !== reqId.current) return; // a newer request already ran
    const pts = (data ?? []) as { lat: number; lng: number }[];
    const built = buildCells(pts, cell);
    setCells(built);
    setMax(built.reduce((m, c) => Math.max(m, c.count), 0));
  }, [map, supabase]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 250);
  }, [refresh]);

  useMapEvents({ moveend: schedule, zoomend: schedule });

  useEffect(() => {
    refresh();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh]);

  return (
    <>
      {/* Everything in view reads "clear" (green) by default. */}
      {bounds && (
        <Rectangle
          bounds={[
            [bounds.south, bounds.west],
            [bounds.north, bounds.east],
          ]}
          pathOptions={{
            stroke: false,
            fillColor: "#22c55e",
            fillOpacity: 0.12,
            interactive: false,
          }}
        />
      )}
      {cells.map((c, i) => (
        <Rectangle
          key={i}
          bounds={c.bounds}
          pathOptions={{
            stroke: false,
            fillColor: heatColor(c.count, max),
            fillOpacity: 0.55,
            interactive: false,
          }}
        />
      ))}
    </>
  );
}
