// Catalogs shared by UI + validation. Values MUST match the DB enums
// (incident_tipo, alert_tipo) in supabase/schema.sql.

import {
  TriangleAlert,
  Angry,
  TrafficCone,
  CarFront,
  Bike,
  SquareParking,
  Gauge,
  Smartphone,
  ArrowLeftRight,
  CircleHelp,
  BellRing,
  Disc3,
  Lightbulb,
  Ban,
  Wind,
  type LucideIcon,
} from "lucide-react";

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
  icon: LucideIcon;
}

export const INCIDENT_TYPES: CatalogItem<IncidentTipo>[] = [
  {
    value: "conduccion_imprudente",
    label: "Conducción imprudente",
    icon: TriangleAlert,
  },
  { value: "conduccion_agresiva", label: "Conducción agresiva", icon: Angry },
  {
    value: "no_respetar_semaforos",
    label: "No respetar semáforos",
    icon: TrafficCone,
  },
  { value: "chocar_a_otros", label: "Chocar a otros", icon: CarFront },
  {
    value: "conducir_por_ciclovia",
    label: "Conducir por ciclovía",
    icon: Bike,
  },
  { value: "estacionar_mal", label: "Estacionar mal", icon: SquareParking },
  { value: "exceso_velocidad", label: "Exceso de velocidad", icon: Gauge },
  {
    value: "uso_celular",
    label: "Uso del celular al conducir",
    icon: Smartphone,
  },
  { value: "invadir_carril", label: "Invadir carril", icon: ArrowLeftRight },
  { value: "otro", label: "Otro", icon: CircleHelp },
];

export const ALERT_TYPES: CatalogItem<AlertTipo>[] = [
  { value: "alarma_sonando", label: "Alarma sonando", icon: BellRing },
  { value: "rueda_pinchada", label: "Rueda pinchada", icon: Disc3 },
  { value: "luces_encendidas", label: "Luces encendidas", icon: Lightbulb },
  { value: "bloqueando_salida", label: "Bloqueando salida", icon: Ban },
  { value: "ventana_abierta", label: "Ventana abierta", icon: Wind },
  { value: "otro", label: "Otro", icon: CircleHelp },
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
export const incidentIcon = (v: string): LucideIcon =>
  incidentMap.get(v as IncidentTipo)?.icon ?? CircleHelp;
export const alertLabel = (v: string) =>
  alertMap.get(v as AlertTipo)?.label ?? v;
export const alertIcon = (v: string): LucideIcon =>
  alertMap.get(v as AlertTipo)?.icon ?? CircleHelp;
