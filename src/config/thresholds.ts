// Product "tuning knobs": time windows and thresholds that change behaviour.
// Kept in one place so they're easy to find, review, and adjust. Domain
// modules re-export these so call sites keep reading naturally.

// A report counts as "recent" if it happened within this many days.
export const RECENT_DAYS = 30;

// Number of recent reports that escalates a vehicle from orange to red.
export const RED_THRESHOLD = 3;

// A live alert stays "active" only for this long after it was raised. Past
// this window it auto-deactivates everywhere it's read (no cron needed).
export const ALERT_ACTIVE_WINDOW_MS = 60 * 60 * 1000;

// A user can't re-report the same plate + incident type within this window;
// cuts down accidental double-taps and repeat spam.
export const REPORT_COOLDOWN_MS = 15 * 60 * 1000;
