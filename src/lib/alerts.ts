import type { LiveAlert } from "@/lib/types";
import { ALERT_ACTIVE_WINDOW_MS } from "@/config/thresholds";

// Re-exported for existing importers; defined in @/config/thresholds.
export { ALERT_ACTIVE_WINDOW_MS } from "@/config/thresholds";

// An alert is urgent/active if it hasn't been resolved (dismissed) and it
// was raised within the active window.
export function isAlertActive(
  alert: Pick<LiveAlert, "estado" | "created_at">,
  now: number = Date.now(),
): boolean {
  if (alert.estado !== "activo") return false;
  return now - new Date(alert.created_at).getTime() < ALERT_ACTIVE_WINDOW_MS;
}
