// App-level identity constants. Single source of truth for the app name and
// URL so every surface (metadata, manifest, emails, install prompts) agrees.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Alerta Patente";

// Public origin, used in emails and share/manifest URLs. Optional.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
