// Nominatim (OpenStreetMap) geocoding. Free, no key. Respect the usage
// policy: low volume, identify the app. For heavy use, self-host or use a
// paid provider.

const BASE = "https://nominatim.openstreetmap.org";
const HEADERS = { "Accept-Language": "es" };

export interface GeoResult {
  lat: number;
  lng: number;
  label: string;
}

/** Forward geocode: free-text address -> candidate points. */
export async function searchAddress(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = `${BASE}/search?format=jsonv2&limit=5&countrycodes=ar&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    label: d.display_name,
  }));
}

/** Reverse geocode: point -> human readable address. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = `${BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
