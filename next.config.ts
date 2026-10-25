import type { NextConfig } from "next";

/** Sent with every response. */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const noIndex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // The photos are stored in 4K; serve every size at quality 85 (the default 75 is coerced to
    // the closest allowed value) so they stay sharp on large and high-density screens.
    qualities: [85],
    // AVIF first (about a third smaller than WebP at the same quality), WebP as the fallback.
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // When several rules set the same header for a path, the last matching rule wins,
    // so the route-specific rules come after the global one.
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Quote links carry a secret token: never leak it via Referer, never index the page.
        source: "/offert/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }, noIndex],
      },
      { source: "/admin/:path*", headers: [noIndex] },
    ];
  },
};

export default nextConfig;
