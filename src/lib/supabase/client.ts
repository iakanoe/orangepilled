import { createBrowserClient } from "@supabase/ssr";

// Browser (client component) Supabase client. Uses the public publishable
// key; RLS enforces what the signed-in user can read/write.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
