// Central registry of the Lucide icons used by the app's catalogs. Icons are
// imported (not referenced by string) so tree-shaking keeps the bundle small
// and `IconKey` gives autocomplete + a compile error if a used icon is removed.

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

export const ICONS = {
  conduccion_imprudente: TriangleAlert,
  conduccion_agresiva: Angry,
  no_respetar_semaforos: TrafficCone,
  chocar_a_otros: CarFront,
  conducir_por_ciclovia: Bike,
  estacionar_mal: SquareParking,
  exceso_velocidad: Gauge,
  uso_celular: Smartphone,
  invadir_carril: ArrowLeftRight,
  alarma_sonando: BellRing,
  rueda_pinchada: Disc3,
  luces_encendidas: Lightbulb,
  bloqueando_salida: Ban,
  ventana_abierta: Wind,
  otro: CircleHelp,
} as const satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

// Shared fallback for unknown / missing keys.
export const FALLBACK_ICON: LucideIcon = CircleHelp;
