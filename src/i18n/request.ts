import { getRequestConfig } from "next-intl/server";

// Single-locale setup (no URL routing). Everything reads from one message
// file today; add more locales here later without touching call sites.
export const locale = "es-AR";

export default getRequestConfig(async () => ({
  locale,
  messages: (await import(`../../messages/${locale}.json`)).default,
}));
