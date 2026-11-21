import { hostRedirects } from "./scripts/host-redirects.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow build to succeed even with ESLint errors (for now)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors fail the build (tsc is at 0).
    ignoreBuildErrors: false,
  },
  // Old domain -> canonical, www -> apex (see scripts/host-redirects.mjs). Same env names/order as lib/site.ts.
  async redirects() {
    return hostRedirects(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "");
  },
};

export default nextConfig;
