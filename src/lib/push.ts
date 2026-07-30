import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured (run `npm run gen:vapid`)");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string; // deep link opened on click
  tag?: string;
  image?: string; // notification photo
}

/**
 * Send a Web Push notification to every subscription of a user.
 * Prunes expired subscriptions (404/410). Never throws for delivery
 * failures — a dead endpoint must not break the request flow.
 */
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; pruned: number }> {
  ensureConfigured();

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return { sent: 0, pruned: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          // `urgency: high` tells the push service (FCM/APNs) to wake a
          // sleeping/closed device promptly instead of batching under Doze /
          // low-power. `TTL` keeps the message queued for a day if the device
          // is offline, so it still lands once the phone reconnects.
          { urgency: "high", TTL: 24 * 60 * 60 },
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );

  if (dead.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", dead);
  }

  return { sent, pruned: dead.length };
}
