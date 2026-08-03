// Business catalog: incident/alert types + severity. Values MUST match the DB
// enums (incident_tipo, alert_tipo) in supabase/schema.sql. Labels live here as
// centralized business copy (not in messages/, since they're also composed
// server-side for push bodies where there's no request-scoped translator).

import { ICONS } from "@/config/icons";
import type { LucideIcon } from "lucide-react";

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
    icon: ICONS.conduccion_imprudente,
  },
  {
    value: "conduccion_agresiva",
    label: "Conducción agresiva",
    icon: ICONS.conduccion_agresiva,
  },
  {
    value: "no_respetar_semaforos",
    label: "No respetar semáforos",
    icon: ICONS.no_respetar_semaforos,
  },
  {
    value: "chocar_a_otros",
    label: "Chocar a otros",
    icon: ICONS.chocar_a_otros,
  },
  {
    value: "conducir_por_ciclovia",
    label: "Conducir por ciclovía",
    icon: ICONS.conducir_por_ciclovia,
  },
  {
    value: "estacionar_mal",
    label: "Estacionar mal",
    icon: ICONS.estacionar_mal,
  },
  {
    value: "exceso_velocidad",
    label: "Exceso de velocidad",
    icon: ICONS.exceso_velocidad,
  },
  {
    value: "uso_celular",
    label: "Uso del celular al conducir",
    icon: ICONS.uso_celular,
  },
  {
    value: "invadir_carril",
    label: "Invadir carril",
    icon: ICONS.invadir_carril,
  },
  { value: "otro", label: "Otro", icon: ICONS.otro },
];

export const ALERT_TYPES: CatalogItem<AlertTipo>[] = [
  {
    value: "alarma_sonando",
    label: "Alarma sonando",
    icon: ICONS.alarma_sonando,
  },
  {
    value: "rueda_pinchada",
    label: "Rueda pinchada",
    icon: ICONS.rueda_pinchada,
  },
  {
    value: "luces_encendidas",
    label: "Luces encendidas",
    icon: ICONS.luces_encendidas,
  },
  {
    value: "bloqueando_salida",
    label: "Bloqueando salida",
    icon: ICONS.bloqueando_salida,
  },
  {
    value: "ventana_abierta",
    label: "Ventana abierta",
    icon: ICONS.ventana_abierta,
  },
  { value: "otro", label: "Otro", icon: ICONS.otro },
];

export const SEVERIDAD_LABELS: Record<number, string> = {
  1: "Leve",
  2: "Menor",
  3: "Moderada",
  4: "Grave",
  5: "Muy grave",
};
