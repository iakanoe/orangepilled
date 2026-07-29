import { createClient } from "@/lib/supabase/server";
import NotificationList, {
  type NotifItem,
} from "@/components/NotificationList";
import {
  incidentEmoji,
  incidentLabel,
  alertEmoji,
  alertLabel,
} from "@/lib/incident-types";
import type { NotificationRow, Report, LiveAlert, MediaRow } from "@/lib/types";

export const metadata = { title: "Notificaciones" };

export default async function NotificacionesPage() {
  const supabase = await createClient();

  const { data: notifsData } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const notifs = (notifsData ?? []) as NotificationRow[];

  const reportIds = notifs
    .filter((n) => n.origen === "report")
    .map((n) => n.origen_id);
  const alertIds = notifs
    .filter((n) => n.origen === "alert")
    .map((n) => n.origen_id);

  const [reportsRes, alertsRes, mediaRes] = await Promise.all([
    reportIds.length
      ? supabase.from("reports").select("*").in("id", reportIds)
      : Promise.resolve({ data: [] as Report[] }),
    alertIds.length
      ? supabase.from("live_alerts").select("*").in("id", alertIds)
      : Promise.resolve({ data: [] as LiveAlert[] }),
    reportIds.length || alertIds.length
      ? supabase
          .from("media")
          .select("*")
          .or(
            [
              reportIds.length ? `report_id.in.(${reportIds.join(",")})` : "",
              alertIds.length ? `alert_id.in.(${alertIds.join(",")})` : "",
            ]
              .filter(Boolean)
              .join(","),
          )
      : Promise.resolve({ data: [] as MediaRow[] }),
  ]);

  const reports = new Map(
    ((reportsRes.data ?? []) as Report[]).map((r) => [r.id, r]),
  );
  const alerts = new Map(
    ((alertsRes.data ?? []) as LiveAlert[]).map((a) => [a.id, a]),
  );
  const media = (mediaRes.data ?? []) as MediaRow[];
  const firstImage = (opts: { reportId?: string; alertId?: string }) =>
    media.find(
      (m) =>
        (opts.reportId && m.report_id === opts.reportId) ||
        (opts.alertId && m.alert_id === opts.alertId),
    )?.url ?? null;

  const items: NotifItem[] = notifs
    .map((n): NotifItem | null => {
      if (n.origen === "report") {
        const r = reports.get(n.origen_id);
        if (!r) return null;
        return {
          id: n.id,
          leido: n.leido,
          created_at: n.created_at,
          origen: "report",
          emoji: incidentEmoji(r.tipo),
          label: incidentLabel(r.tipo),
          patente: r.patente,
          descripcion: r.descripcion,
          lat: r.lat,
          lng: r.lng,
          direccion: r.direccion,
          image: firstImage({ reportId: r.id }),
        };
      }
      const a = alerts.get(n.origen_id);
      if (!a) return null;
      return {
        id: n.id,
        leido: n.leido,
        created_at: n.created_at,
        origen: "alert",
        emoji: alertEmoji(a.tipo),
        label: alertLabel(a.tipo),
        patente: a.patente,
        descripcion: a.descripcion,
        lat: a.lat,
        lng: a.lng,
        direccion: a.direccion,
        image: firstImage({ alertId: a.id }),
      };
    })
    .filter((x): x is NotifItem => x !== null);

  return (
    <>
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold">Notificaciones</h1>
      </header>
      <NotificationList initial={items} />
    </>
  );
}
