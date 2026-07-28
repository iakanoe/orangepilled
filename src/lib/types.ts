import type { IncidentTipo, AlertTipo } from "@/lib/incident-types";

export type VehicleTipo = "particular" | "flota";
export type AlertEstado = "activo" | "resuelto";
export type NotifOrigen = "report" | "alert";
export type UserRol = "dueno" | "admin_flota" | "admin_sistema";

export interface Profile {
  id: string;
  nombre: string | null;
  rol: UserRol;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  patente: string;
  alias: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  foto_url: string | null;
  tipo: VehicleTipo;
  verificado: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  patente: string;
  vehicle_id: string | null;
  reporter_id: string;
  tipo: IncidentTipo;
  descripcion: string | null;
  severidad: number | null;
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  ocurrido_en: string;
  created_at: string;
}

export interface LiveAlert {
  id: string;
  patente: string;
  vehicle_id: string | null;
  reporter_id: string;
  tipo: AlertTipo;
  descripcion: string | null;
  lat: number | null;
  lng: number | null;
  direccion: string | null;
  estado: AlertEstado;
  created_at: string;
}

export interface MediaRow {
  id: string;
  report_id: string | null;
  alert_id: string | null;
  url: string;
  tipo: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  origen: NotifOrigen;
  origen_id: string;
  leido: boolean;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// Minimal typed shape for the service-role supabase-js client. Only the
// tables the server writes to need to be precise here.
type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      vehicles: Table<Vehicle>;
      reports: Table<Report>;
      live_alerts: Table<LiveAlert>;
      media: Table<MediaRow>;
      notifications: Table<NotificationRow>;
      push_subscriptions: Table<PushSubscriptionRow>;
    };
    Views: {
      reports_heatmap: {
        Row: { lat: number; lng: number; tipo: IncidentTipo; ocurrido_en: string };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      incident_tipo: IncidentTipo;
      alert_tipo: AlertTipo;
      vehicle_tipo: VehicleTipo;
      alert_estado: AlertEstado;
      notif_origen: NotifOrigen;
    };
  };
}
