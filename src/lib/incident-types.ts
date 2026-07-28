// Catalogs shared by UI + validation. Values MUST match the DB enums
// (incident_tipo, alert_tipo) in supabase/schema.sql.

export type IncidentTipo =
  | "conduccion_imprudente"
  | "conduccion_agresiva"
  | "no_respetar_semaforos"
  | "chocar_a_otros"
  | "conducir_por_ciclovia"
  | "estacionar_mal"
  | "exceso_velocidad"
  | "uso_celular"
  | "invadir_carril"
  | "otro";

export type AlertTipo =
  | "alarma_sonando"
  | "rueda_pinchada"
  | "luces_encendidas"
  | "bloqueando_salida"
  | "ventana_abierta"
  | "otro";

export interface CatalogItem<T extends string> {
  value: T;
  label: string;
  emoji: string;
}

export const INCIDENT_TYPES: CatalogItem<IncidentTipo>[] = [
  { value: "conduccion_imprudente", label: "Conducción imprudente", emoji: "😨" },
  { value: "conduccion_agresiva", label: "Conducción agresiva", emoji: "😡" },
  { value: "no_respetar_semaforos", label: "No respetar semáforos", emoji: "🚦" },
  { value: "chocar_a_otros", label: "Chocar a otros", emoji: "💥" },
  { value: "conducir_por_ciclovia", label: "Conducir por ciclovía", emoji: "🚲" },
  { value: "estacionar_mal", label: "Estacionar mal", emoji: "🅿️" },
  { value: "exceso_velocidad", label: "Exceso de velocidad", emoji: "🏎️" },
  { value: "uso_celular", label: "Uso del celular al conducir", emoji: "📱" },
  { value: "invadir_carril", label: "Invadir carril", emoji: "↔️" },
  { value: "otro", label: "Otro", emoji: "❓" },
];

export const ALERT_TYPES: CatalogItem<AlertTipo>[] = [
  { value: "alarma_sonando", label: "Alarma sonando", emoji: "🔔" },
  { value: "rueda_pinchada", label: "Rueda pinchada", emoji: "🛞" },
  { value: "luces_encendidas", label: "Luces encendidas", emoji: "💡" },
  { value: "bloqueando_salida", label: "Bloqueando salida", emoji: "🚧" },
  { value: "ventana_abierta", label: "Ventana abierta", emoji: "🪟" },
  { value: "otro", label: "Otro", emoji: "❓" },
];

export const SEVERIDAD_LABELS: Record<number, string> = {
  1: "Leve",
  2: "Menor",
  3: "Moderada",
  4: "Grave",
  5: "Muy grave",
};

const incidentMap = new Map(INCIDENT_TYPES.map((i) => [i.value, i]));
const alertMap = new Map(ALERT_TYPES.map((a) => [a.value, a]));

export const isIncidentTipo = (v: string): v is IncidentTipo =>
  incidentMap.has(v as IncidentTipo);
export const isAlertTipo = (v: string): v is AlertTipo =>
  alertMap.has(v as AlertTipo);

export const incidentLabel = (v: string) =>
  incidentMap.get(v as IncidentTipo)?.label ?? v;
export const incidentEmoji = (v: string) =>
  incidentMap.get(v as IncidentTipo)?.emoji ?? "❓";
export const alertLabel = (v: string) => alertMap.get(v as AlertTipo)?.label ?? v;
export const alertEmoji = (v: string) => alertMap.get(v as AlertTipo)?.emoji ?? "❓";
