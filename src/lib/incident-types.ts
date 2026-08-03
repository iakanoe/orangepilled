// Behavior layer over the catalog: lookups, type guards and label/icon
// resolvers. The catalog data (types, items, labels) lives in @/config/catalog
// and is re-exported here so existing imports keep working.

import {
  INCIDENT_TYPES,
  ALERT_TYPES,
  type IncidentTipo,
  type AlertTipo,
} from "@/config/catalog";
import { FALLBACK_ICON } from "@/config/icons";
import type { LucideIcon } from "lucide-react";

export {
  INCIDENT_TYPES,
  ALERT_TYPES,
  SEVERIDAD_LABELS,
  type IncidentTipo,
  type AlertTipo,
  type CatalogItem,
} from "@/config/catalog";

const incidentMap = new Map(INCIDENT_TYPES.map((i) => [i.value, i]));
const alertMap = new Map(ALERT_TYPES.map((a) => [a.value, a]));

export const isIncidentTipo = (v: string): v is IncidentTipo =>
  incidentMap.has(v as IncidentTipo);
export const isAlertTipo = (v: string): v is AlertTipo =>
  alertMap.has(v as AlertTipo);

export const incidentLabel = (v: string) =>
  incidentMap.get(v as IncidentTipo)?.label ?? v;
export const incidentIcon = (v: string): LucideIcon =>
  incidentMap.get(v as IncidentTipo)?.icon ?? FALLBACK_ICON;
export const alertLabel = (v: string) =>
  alertMap.get(v as AlertTipo)?.label ?? v;
export const alertIcon = (v: string): LucideIcon =>
  alertMap.get(v as AlertTipo)?.icon ?? FALLBACK_ICON;
