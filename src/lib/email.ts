import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Resend client — SERVER ONLY. Null when no key is configured so the
// caller can degrade gracefully (e.g. local dev without email).
export const resend = apiKey ? new Resend(apiKey) : null;

// From address. On the Resend free tier you can either use the shared
// `onboarding@resend.dev` sender (only delivers to your own account email)
// or verify one domain for free and set EMAIL_FROM to it.
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Alerta Patente <onboarding@resend.dev>";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Alerta Patente";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

// Brand palette (kept in sync with tailwind.config.ts `brand`).
const BRAND = "#ea580c"; // brand-600
const INK = "#18181b";
const MUTED = "#71717a";
const FAINT = "#a1a1aa";
const BG = "#f4f4f5";

/**
 * Shared, branding-consistent email shell. Every transactional email should
 * render its content through this so header/footer/colors stay uniform.
 * Table-based + inline styles for broad email-client support.
 */
export function emailLayout({
  preheader,
  heading,
  bodyHtml,
}: {
  preheader: string;
  heading: string;
  bodyHtml: string;
}) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${APP_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK}">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px">
            <tr>
              <td align="center" style="padding-bottom:20px">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:44px;height:44px;background:${BRAND};border-radius:12px;text-align:center;vertical-align:middle;font-size:24px;line-height:44px">🚗</td>
                    <td style="padding-left:12px;font-size:18px;font-weight:700;color:${INK}">${APP_NAME}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:16px;padding:32px 28px">
                <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${INK}">${heading}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 8px 0;font-size:12px;color:${FAINT}">
                ${APP_URL ? `<a href="${APP_URL}" style="color:${FAINT};text-decoration:none">${APP_URL.replace(/^https?:\/\//, "")}</a> · ` : ""}Enviado por ${APP_NAME}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Auth email body: a magic-link button plus the 6-digit fallback code.
function authEmailBody({
  code,
  magicLink,
  isSignup,
}: {
  code: string;
  magicLink?: string;
  isSignup: boolean;
}) {
  const intro = isSignup
    ? "Confirmá tu email para empezar a usar la app:"
    : "Tocá el botón para ingresar:";

  const linkBlock = magicLink
    ? `
      <p style="margin:0 0 16px;font-size:14px;color:${MUTED}">${intro}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <a href="${magicLink}" style="display:inline-block;background:${BRAND};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px">
              ${isSignup ? "Confirmar y entrar" : "Entrar a la app"}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 12px;font-size:13px;color:${FAINT};text-align:center">
        o ingresá este código en la app
      </p>`
    : `<p style="margin:0 0 16px;font-size:14px;color:${MUTED}">Ingresá este código en la app:</p>`;

  return `
    ${linkBlock}
    <div style="font-size:32px;font-weight:700;letter-spacing:10px;text-align:center;background:${BG};border-radius:12px;padding:16px 0;color:${INK}">
      ${code}
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:${FAINT};text-align:center">
      Vence en unos minutos. Si no lo pediste, ignorá este mensaje.
    </p>`;
}

/**
 * Send an auth email (magic link + OTP code) for sign-up or login.
 * Throws when Resend isn't configured or the API call fails so the caller
 * (the Send Email hook) can surface the error to Supabase.
 */
export async function sendAuthEmail(
  to: string,
  {
    code,
    magicLink,
    isSignup = false,
  }: { code: string; magicLink?: string; isSignup?: boolean },
) {
  if (!resend) throw new Error("RESEND_API_KEY is not set");

  const heading = isSignup
    ? `Bienvenido a ${APP_NAME}`
    : `Ingresá a ${APP_NAME}`;

  const html = emailLayout({
    preheader: `Tu código es ${code}`,
    heading,
    bodyHtml: authEmailBody({ code, magicLink, isSignup }),
  });

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${code} es tu código de ${APP_NAME}`,
    html,
    text: magicLink
      ? `Tu código de ${APP_NAME} es ${code}. También podés entrar con este enlace: ${magicLink} (vence en unos minutos).`
      : `Tu código de ${APP_NAME} es ${code}. Vence en unos minutos.`,
  });
  if (error) throw new Error(error.message);
}
