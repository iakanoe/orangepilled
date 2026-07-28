import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";

// A revision versions precached pages so stale responses are not served.
// Not a git repo by default, so we use a random per-build revision.
const revision = randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Precache the offline fallback route.
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
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

export default withSerwist(nextConfig);
