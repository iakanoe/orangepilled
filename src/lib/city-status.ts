// Helpers for the "Mapa general" section: a city-wide view of
// reported incidents built from the anonymized `reports_heatmap` view
// (lat/lng/tipo/ocurrido_en, no patente / no RLS). Everything here is pure
// so it can run on the server (page) and the client (map/chart).

// Default map center: CABA, used until the device location is available.
export const CABA_CENTER = { lat: -34.6037, lng: -58.3816 } as const;

// Coarse bounding box for CABA, used to frame the whole city on first load.
export const CABA_BOUNDS = {
  south: -34.705,
  north: -34.526,
  west: -58.531,
  east: -58.335,
} as const;

// Zoom bounds. Max ~= a neighborhood; min ~= the whole country.
export const MAP_MIN_ZOOM = 4;
export const MAP_MAX_ZOOM = 16;
export const DEFAULT_ZOOM = 12;

// Reference: at REF_ZOOM a grid cell spans REF_CELL degrees. Cell size halves
// on each zoom-in, so the number of cells on screen stays roughly constant.
const REF_ZOOM = 12;
const REF_CELL = 0.01;
const MIN_CELL = 0.0005; // ~55 m floor so a deep zoom never overloads
const MAX_CELL = 5; // sane ceiling at country / continent scale

/** Grid cell size (degrees) for a given map zoom level. */
export function cellSizeForZoom(zoom: number): number {
  const size = REF_CELL * Math.pow(2, REF_ZOOM - Math.round(zoom));
  return Math.min(MAX_CELL, Math.max(MIN_CELL, size));
}

// Buenos Aires is UTC-3 year-round (no DST).
const BA_OFFSET_MS = 3 * 60 * 60 * 1000;

export interface HeatPoint {
  lat: number;
  lng: number;
}

export interface Cell {
  // Bounds of the cell, ready for a leaflet Rectangle.
  bounds: [[number, number], [number, number]];
  count: number;
}

export interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Grow a bounds box by `fraction` of its span on every side. */
export function padBounds(b: Bounds, fraction = 0.4): Bounds {
  const dLat = (b.north - b.south) * fraction;
  const dLng = (b.east - b.west) * fraction;
  return {
    south: Math.max(-85, b.south - dLat),
    north: Math.min(85, b.north + dLat),
    west: Math.max(-180, b.west - dLng),
    east: Math.min(180, b.east + dLng),
  };
}

/** Start of "today" in Buenos Aires, returned as an ISO string (UTC). */
export function startOfTodayBA(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - BA_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() + BA_OFFSET_MS).toISOString();
}

/**
 * Bucket points into a grid of `cellSize` degrees, anchored to the world
 * origin so cells stay put while panning. Only non-empty cells are returned.
 */
export function buildCells(points: HeatPoint[], cellSize: number): Cell[] {
  const counts = new Map<string, number>();
  for (const p of points) {
    const gx = Math.floor((p.lng + 180) / cellSize);
    const gy = Math.floor((p.lat + 90) / cellSize);
    const key = `${gx}:${gy}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: Cell[] = [];
  for (const [key, count] of counts) {
    const [gx, gy] = key.split(":").map(Number);
    const west = -180 + gx * cellSize;
    const south = -90 + gy * cellSize;
    cells.push({
      bounds: [
        [south, west],
        [south + cellSize, west + cellSize],
      ],
      count,
    });
  }
  return cells;
}

/**
 * Green (few) -> yellow -> red (many) color for a cell, relative to the
 * busiest cell so the scale always spans the current data.
 */
export function heatColor(count: number, max: number): string {
  if (max <= 0) return "#22c55e";
  // Compress with sqrt so a couple of hotspots don't wash out mid-range.
  const t = Math.min(1, Math.sqrt(count / max));
  // 120° (green) -> 0° (red) through yellow.
  const hue = 120 * (1 - t);
  return `hsl(${hue}, 80%, 45%)`;
}
