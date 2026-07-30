import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Magic-link verifier. The link in the auth email points here with a
// token_hash; we exchange it for a session (cookies set by the server
// client) and redirect to the intended destination. On failure we bounce
// back to /login with an error flag.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only allow same-origin redirects to avoid open-redirect abuse.
  const rawNext = searchParams.get("next") ?? "/";
  let next = "/";
  try {
    const target = new URL(rawNext, origin);
    if (target.origin === origin) next = target.pathname + target.search;
  } catch {
    /* keep default */
  }

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "link");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
