"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, {
  type LatLngBoundsExpression,
  type Map as LeafletMap,
} from "leaflet";
import "leaflet.heat";
import { createClient } from "@/lib/supabase/client";
import "@/lib/leaflet-icon";
import {
  CABA_BOUNDS,
  HEAT_GRADIENT,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  padBounds,
  startOfWindowBA,
  type Bounds,
} from "@/lib/city-status";

type LatLng = { lat: number; lng: number };

// Frame the whole city on first load (until the device location kicks in).
const CABA_BBOX: LatLngBoundsExpression = [
  [CABA_BOUNDS.south, CABA_BOUNDS.west],
  [CABA_BOUNDS.north, CABA_BOUNDS.east],
];

// Leaflet.heat's simpleheat calls getImageData on every redraw; opt its canvas
// into willReadFrequently so the browser keeps it in a CPU-readable buffer and
// stops warning about slow readbacks.
let heatCanvasPatched = false;
function patchHeatCanvasReadback() {
  if (heatCanvasPatched || typeof HTMLCanvasElement === "undefined") return;
  heatCanvasPatched = true;
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    attrs?: CanvasRenderingContext2DSettings,
  ) {
    if (type === "2d" && this.classList.contains("leaflet-heatmap-layer")) {
      return original.call(this, type, { ...attrs, willReadFrequently: true });
    }
    return original.call(this, type, attrs);
  } as typeof HTMLCanvasElement.prototype.getContext;
}

// Leaflet.heat queues `_redraw` on requestAnimationFrame. If the layer is
// removed (navigation/unmount) before that frame runs, Leaflet has already set
// `_map` to null and `_redraw` throws on `getSize`. Guard the prototype so
// stale frames become no-ops.
let heatRedrawPatched = false;
function patchHeatRedrawGuard() {
  if (heatRedrawPatched) return;
  interface HeatProto {
    _map: unknown;
    _redraw: () => void;
    redraw: () => unknown;
  }
  const ctor = (L as unknown as { HeatLayer?: { prototype: HeatProto } })
    .HeatLayer;
  if (!ctor) return;
  heatRedrawPatched = true;
  const proto = ctor.prototype;
  const originalRedraw = proto._redraw;
  proto._redraw = function (this: HeatProto) {
    if (this._map) originalRedraw.call(this);
  };
  const originalSchedule = proto.redraw;
  proto.redraw = function (this: HeatProto) {
    return this._map ? originalSchedule.call(this) : this;
  };
}

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
        <HeatLayer />
      </MapContainer>

      <button
        type="button"
        onClick={recenter}
        aria-label="Centrar en mi ubicación"
        className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-3 z-[500] grid h-11 w-11 place-items-center rounded-full bg-white text-gray-700 shadow-pop ring-1 ring-black/5 active:scale-95 dark:bg-gray-800 dark:text-gray-200 dark:ring-white/10"
      >
        <LocateFixed className="h-5 w-5" aria-hidden />
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

// Fetches incidents for the visible area (plus padding) and paints a smooth
// gradient heat layer (canvas) over a green baseline. The whole area reads
// "clear" (green) by default and ramps toward red where reports cluster.
// Re-runs on pan/zoom.
function HeatLayer() {
  const map = useMap();
  const supabase = useMemo(() => createClient(), []);
  const layerRef = useRef<L.HeatLayer | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const reqId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const b = map.getBounds();
    const padded = padBounds({
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    });
    setBounds(padded);

    const id = ++reqId.current;
    const { data } = await supabase
      .from("reports_heatmap")
      .select("lat,lng")
      .gte("ocurrido_en", startOfWindowBA())
      .gte("lat", padded.south)
      .lte("lat", padded.north)
      .gte("lng", padded.west)
      .lte("lng", padded.east)
      .limit(10000);

    if (id !== reqId.current || !alive.current) return; // stale or unmounted
    const pts = (data ?? []) as { lat: number; lng: number }[];
    const heatPoints = pts.map(
      (p) => [p.lat, p.lng, 1] as [number, number, number],
    );

    if (!layerRef.current) {
      patchHeatCanvasReadback();
      patchHeatRedrawGuard();
      layerRef.current = L.heatLayer(heatPoints, {
        radius: 28,
        blur: 24,
        minOpacity: 0.3,
        maxZoom: MAP_MAX_ZOOM,
        gradient: HEAT_GRADIENT,
      }).addTo(map);
    } else {
      layerRef.current.setLatLngs(heatPoints);
    }
  }, [map, supabase]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 250);
  }, [refresh]);

  useMapEvents({ moveend: schedule, zoomend: schedule });

  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  }, [refresh]);

  // Green baseline under the heat canvas so quiet areas read "clear".
  if (!bounds) return null;
  return (
    <Rectangle
      bounds={[
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ]}
      pathOptions={{
        stroke: false,
        fillColor: "#22c55e",
        fillOpacity: 0.2,
        interactive: false,
      }}
    />
  );
}
