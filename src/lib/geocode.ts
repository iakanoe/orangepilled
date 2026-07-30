// Nominatim (OpenStreetMap) geocoding. Free, no key. Respect the usage
// policy: low volume, identify the app. For heavy use, self-host or use a
// paid provider.

import { CABA_BOUNDS } from "./city-status";

const BASE = "https://nominatim.openstreetmap.org";
const HEADERS = { "Accept-Language": "es" };

// Bias results towards the city so a bare street name / intersection resolves
// to the right place. Nominatim viewbox is "min_lon,min_lat,max_lon,max_lat".
const VIEWBOX = `${CABA_BOUNDS.west},${CABA_BOUNDS.south},${CABA_BOUNDS.east},${CABA_BOUNDS.north}`;
const CITY_CONTEXT = "Ciudad Autónoma de Buenos Aires, Argentina";

// Spanish ways of writing a corner: "callao y corrientes", "callao esq.
// corrientes", "callao esquina corrientes".
const INTERSECTION_RE = /^\s*(.+?)\s+(?:y|e|esq\.?|esquina|&|and)\s+(.+?)\s*$/i;

export interface GeoResult {
  lat: number;
  lng: number;
  label: string;
}

function withCity(q: string): string {
  return /buenos aires|caba|argentina/i.test(q) ? q : `${q}, ${CITY_CONTEXT}`;
}

/** Build the query variants to try, best guess first. Detects intersections
 *  ("A y B") and rewrites them to the "A & B" form Nominatim understands. */
function queryVariants(raw: string): string[] {
  const variants: string[] = [];
  const m = raw.match(INTERSECTION_RE);
  if (m) {
    variants.push(withCity(`${m[1].trim()} & ${m[2].trim()}`));
  }
  variants.push(withCity(raw));
  return [...new Set(variants)];
}

async function runSearch(q: string): Promise<GeoResult[]> {
  const url = `${BASE}/search?format=jsonv2&limit=5&countrycodes=ar&viewbox=${VIEWBOX}&q=${encodeURIComponent(
    q,
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

/** Forward geocode: free-text address or intersection -> candidate points. */
export async function searchAddress(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  for (const q of queryVariants(query)) {
    const results = await runSearch(q);
    if (results.length) return results;
  }
  return [];
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
