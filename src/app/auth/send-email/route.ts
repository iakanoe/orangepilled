import { Webhook } from "standardwebhooks";
import { sendAuthEmail } from "@/lib/email";

// Supabase "Send Email" auth hook. Supabase generates the OTP + token hash
// and calls this endpoint (signed as a Standard Webhook) whenever it needs to
// send an auth email — sign-up, magic link / OTP login, recovery, etc. We
// verify the signature and deliver a branded email that carries BOTH a magic
// link and the 6-digit code via Resend. The client keeps using
// supabase.auth.signInWithOtp / verifyOtp unchanged.
//
// This route lives under /auth so it stays outside the session gate in
// middleware (Supabase calls it without a user cookie).

export const dynamic = "force-dynamic";

type HookPayload = {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

// Build the magic-link URL that lands on our /auth/confirm verifier.
function magicLinkFor(d: HookPayload["email_data"]) {
  const base = process.env.NEXT_PUBLIC_APP_URL || d.site_url;
  if (!base) return undefined;
  const url = new URL("/auth/confirm", base);
  url.searchParams.set("token_hash", d.token_hash);
  url.searchParams.set("type", d.email_action_type);
  if (d.redirect_to) url.searchParams.set("next", d.redirect_to);
  return url.toString();
}

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: { message: "SEND_EMAIL_HOOK_SECRET is not set" } },
      { status: 500 },
    );
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  // Supabase stores the secret as "v1,whsec_<base64>"; standardwebhooks
  // wants the base64 part (optionally prefixed with whsec_).
  const wh = new Webhook(secret.replace("v1,whsec_", ""));

  let data: HookPayload;
  try {
    data = wh.verify(payload, headers) as HookPayload;
  } catch {
    return Response.json(
      { error: { message: "invalid signature" } },
      { status: 401 },
    );
  }

  const { user, email_data } = data;

  try {
    await sendAuthEmail(user.email, {
      code: email_data.token,
      magicLink: magicLinkFor(email_data),
      isSignup: email_data.email_action_type === "signup",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    // Supabase surfaces http_code + message to the client that triggered it.
    return Response.json(
      { error: { http_code: 500, message } },
      { status: 500 },
    );
  }

  return Response.json({});
}
