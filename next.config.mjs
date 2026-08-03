import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// A revision versions precached pages so stale responses are not served.
// Not a git repo by default, so we use a random per-build revision.
const revision = randomUUID();

// Leaflet's marker images are emitted twice — once via the JS `import`s in
// leaflet-icon.ts (revision: null) and once via the `url(...)` refs inside
// leaflet.css. Same output file, two cache keys, which makes Serwist throw
// "add-to-cache-list-conflicting-entries" at SW evaluation time. Collapse
// duplicate URLs, keeping a revisioned entry over a revision-less one.
// Leaflet's marker images end up in the precache manifest twice: once via the
// JS `import`s in leaflet-icon.ts and once via the `url(...)` refs in
// leaflet.css. The two entries carry the same file but different URLs — one is
// `/_next/static/...`, the other `/_next//static/...` (a stray double slash)
// with a different revision. Serwist later collapses `//` -> `/`, leaving two
// entries for the same URL with conflicting revisions, which makes the SW throw
// "add-to-cache-list-conflicting-entries" during evaluation (registration
// fails). Normalize slashes and dedupe, keeping a revisioned entry.
const dedupeManifestEntries = (entries) => {
  const byUrl = new Map();
  for (const entry of entries) {
    const url = entry.url.replace(/([^:]\/)\/+/g, "$1");
    const normalized = { ...entry, url };
    const existing = byUrl.get(url);
    if (!existing || (existing.revision == null && entry.revision != null)) {
      byUrl.set(url, normalized);
    }
  }
  return { manifest: [...byUrl.values()], warnings: [] };
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Precache the offline fallback route.
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  manifestTransforms: [dedupeManifestEntries],
  // Avoid SW caching pains during local development.
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this project (a stray lockfile in the home dir
  // otherwise makes Next infer the wrong workspace root).
  outputFileTracingRoot: import.meta.dirname,
  experimental: {
    // Keep already-rendered pages in the client Router Cache so navigating
    // between tabs reuses cached data instead of refetching and flashing the
    // loading.tsx skeleton every time. Dynamic pages default to 0s (no reuse);
    // 5 min gives an instant, app-like feel. Fresh data still arrives via the
    // existing router.refresh() calls (mutations, realtime, pull-to-refresh).
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
  images: {
    // Supabase Storage public bucket. Replace <project-ref> or leave the
    // remotePatterns wide via env-driven config if you prefer.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSerwist(withNextIntl(nextConfig));
