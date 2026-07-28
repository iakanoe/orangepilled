// Argentine license plate validation + normalization.

export type PatenteFormato =
  | "auto_viejo" // ABC123
  | "auto_mercosur" // AB123CD
  | "moto_viejo" // 123ABC
  | "moto_mercosur" // A123BC
  | "invalido";

const PATTERNS: { formato: Exclude<PatenteFormato, "invalido">; re: RegExp }[] = [
  { formato: "auto_viejo", re: /^[A-Z]{3}\d{3}$/ },
  { formato: "auto_mercosur", re: /^[A-Z]{2}\d{3}[A-Z]{2}$/ },
  { formato: "moto_viejo", re: /^\d{3}[A-Z]{3}$/ },
  { formato: "moto_mercosur", re: /^[A-Z]\d{3}[A-Z]{2}$/ },
];

/** Uppercase + strip everything that is not A-Z/0-9. */
export function normalizePatente(raw: string): string {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function detectFormato(raw: string): PatenteFormato {
  const p = normalizePatente(raw);
  return PATTERNS.find(({ re }) => re.test(p))?.formato ?? "invalido";
}

export function isValidPatente(raw: string): boolean {
  return detectFormato(raw) !== "invalido";
}

/**
 * Validate + normalize in one step.
 * Returns the normalized value only when it matches a known format.
 */
export function parsePatente(raw: string): {
  ok: boolean;
  normalized: string;
  formato: PatenteFormato;
} {
  const normalized = normalizePatente(raw);
  const formato = detectFormato(normalized);
  return { ok: formato !== "invalido", normalized, formato };
}

/** Pretty display: "AB 123 CD" / "ABC 123". Falls back to normalized. */
export function formatPatente(raw: string): string {
  const p = normalizePatente(raw);
  switch (detectFormato(p)) {
    case "auto_viejo":
      return `${p.slice(0, 3)} ${p.slice(3)}`;
    case "auto_mercosur":
      return `${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`;
    case "moto_viejo":
      return `${p.slice(0, 3)} ${p.slice(3)}`;
    case "moto_mercosur":
      return `${p.slice(0, 1)} ${p.slice(1, 4)} ${p.slice(4)}`;
    default:
      return p;
  }
}
