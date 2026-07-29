import { createClient } from "@supabase/supabase-js";

// Secret-key client — SERVER ONLY. Bypasses RLS. Use inside Route
// Handlers for privileged cross-owner writes: linking a report to a
// vehicle by patente, fanning out notifications, sending push.
// Never import this into a client component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
