import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // `next dev` reuses its last compile from `.next/dev/cache/turbopack` after a restart.
    // With the custom Tailwind loader below, that cache kept serving an old globals.css
    // (the grey tokens) after the file had changed, so dev compiles from scratch instead.
    turbopackFileSystemCacheForDev: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
