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

// Gradient for the smooth heat layer: green (sparse) -> yellow -> red (dense).
// Keys are the normalized intensity stops leaflet.heat interpolates between.
export const HEAT_GRADIENT: Record<number, string> = {
  0.2: "#22c55e",
  0.5: "#eab308",
  0.8: "#f97316",
  1.0: "#ef4444",
};

// Buenos Aires is UTC-3 year-round (no DST).
const BA_OFFSET_MS = 3 * 60 * 60 * 1000;

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

// Days shown on the city map: today + the previous 7 calendar days.
export const CITY_WINDOW_DAYS = 7;

/**
 * Start of the map window: midnight (Buenos Aires) of `days` calendar days
 * ago, i.e. the last 7 calendar days plus today. Returned as an ISO UTC string.
 */
export function startOfWindowBA(
  days: number = CITY_WINDOW_DAYS,
  now: Date = new Date(),
): string {
  const shifted = new Date(now.getTime() - BA_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - days);
  return new Date(shifted.getTime() + BA_OFFSET_MS).toISOString();
}
