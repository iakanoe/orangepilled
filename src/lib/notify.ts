import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotifOrigen } from "@/lib/types";
import { sendPushToUser } from "@/lib/push";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

/**
 * Create an in-app notification for a vehicle owner and push it to their
 * devices. Best-effort: push failures never break the caller.
 */
export async function notifyOwner(
  admin: SupabaseClient,
  params: {
    ownerId: string;
    origen: NotifOrigen;
    origenId: string;
    title: string;
    body: string;
    image?: string | null;
    path?: string; // in-app deep link, default /notificaciones
  },
) {
  await admin.from("notifications").insert({
    user_id: params.ownerId,
    origen: params.origen,
    origen_id: params.origenId,
  });

  await sendPushToUser(admin, params.ownerId, {
    title: params.title,
    body: params.body,
    image: params.image ?? undefined,
    tag: `${params.origen}:${params.origenId}`,
    url: `${APP_URL}${params.path ?? "/notificaciones"}`,
  });
}
