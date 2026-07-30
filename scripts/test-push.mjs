// Send a test Web Push to stored subscriptions to verify that notifications
// arrive when the app is CLOSED on mobile.
//
// Usage:
//   node scripts/test-push.mjs                 # send to every subscription
//   node scripts/test-push.mjs <user-id>       # send only to that user
//
// How to verify app-closed delivery:
//   1. On the phone, install the PWA to the Home Screen (required on iOS —
//      push does NOT work from a Safari tab) and enable notifications.
//   2. Fully close the app (swipe it away) and lock the screen.
//   3. Run this script from your machine.
//   4. The notification should appear on the lock screen within seconds.
//
// Reads env from .env.local (falls back to .env). Requires the same
// SUPABASE_SECRET_KEY + VAPID vars the server uses.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2].replace(/^["']|["']$/g, "");
        if (process.env[key] === undefined) process.env[key] = val;
      }
    } catch {
      // file may not exist — that's fine
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (!supabaseUrl || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}
if (!publicKey || !privateKey) {
  console.error("Missing VAPID keys. Run `npm run gen:vapid`.");
  process.exit(1);
}
if (subject === "mailto:admin@example.com") {
  console.warn(
    "⚠  VAPID_SUBJECT is the placeholder. Apple/iOS push can reject a\n" +
      "   placeholder subject — set a real mailto: or https: value in .env.local.",
  );
}

webpush.setVapidDetails(subject, publicKey, privateKey);

const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false },
});

const userId = process.argv[2];

let query = admin
  .from("push_subscriptions")
  .select("user_id, endpoint, p256dh, auth");
if (userId) query = query.eq("user_id", userId);

const { data: subs, error } = await query;
if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}
if (!subs?.length) {
  console.error(
    userId
      ? `No push subscriptions for user ${userId}.`
      : "No push subscriptions stored. Enable notifications in the app first.",
  );
  process.exit(1);
}

const payload = JSON.stringify({
  title: "🔔 Prueba de notificación",
  body: "Si ves esto con la app cerrada, el push funciona.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "") + "/notificaciones",
  tag: "test-push",
});

console.log(`Sending test push to ${subs.length} subscription(s)...\n`);

let sent = 0;
let failed = 0;
for (const s of subs) {
  const host = (() => {
    try {
      return new URL(s.endpoint).host;
    } catch {
      return s.endpoint.slice(0, 40);
    }
  })();
  try {
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      payload,
      { urgency: "high", TTL: 24 * 60 * 60 },
    );
    sent++;
    console.log(`  ✓ ${host}  (user ${s.user_id})`);
  } catch (err) {
    failed++;
    const code = err?.statusCode ?? "?";
    console.log(
      `  ✗ ${host}  (user ${s.user_id}) — HTTP ${code} ${err?.body ?? err?.message ?? ""}`.trim(),
    );
  }
}

console.log(`\nDone. Sent ${sent}, failed ${failed}.`);
if (failed) {
  console.log(
    "404/410 = dead subscription (re-enable in app). 400/403 = VAPID key/subject mismatch.",
  );
}
process.exit(failed && !sent ? 1 : 0);
