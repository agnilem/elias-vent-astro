import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep Turbopack from walking up past this folder looking for a workspace root.
  turbopack: { root: __dirname },
  output: 'export', // fully static, same as the Astro build
  trailingSlash: true, // /projects/fauna/, like the Astro build
  images: { unoptimized: true },
  // The 404 renders as its own document (src/app/global-not-found.tsx).
  experimental: { globalNotFound: true },
};

export default nextConfig;
