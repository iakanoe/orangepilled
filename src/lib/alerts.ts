import type { LiveAlert } from "@/lib/types";

// A live alert stays "active" only for this long after it was raised.
// Past this window it auto-deactivates (no cron needed): it stops counting
// as active everywhere it's read, one hour after the owner was notified.
export const ALERT_ACTIVE_WINDOW_MS = 60 * 60 * 1000;

// An alert is urgent/active if it hasn't been resolved (dismissed) and it
// was raised within the active window.
export function isAlertActive(
  alert: Pick<LiveAlert, "estado" | "created_at">,
  now: number = Date.now(),
): boolean {
  if (alert.estado !== "activo") return false;
  return now - new Date(alert.created_at).getTime() < ALERT_ACTIVE_WINDOW_MS;
}
