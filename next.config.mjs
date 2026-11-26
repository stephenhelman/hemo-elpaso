import { hostRedirects } from "./scripts/host-redirects.mjs";
import { legacyRedirects } from "./scripts/legacy-redirects.mjs";
import { legalRedirects } from "./scripts/legal-redirects.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // src/instrumentation.ts runs at server start (it refuses to start with a bad EMAIL_MODE)
  experimental: { instrumentationHook: true },
  eslint: {
    // Allow build to succeed even with ESLint errors (for now)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors fail the build (tsc is at 0).
    ignoreBuildErrors: false,
  },
  // 1) old domain -> canonical, www -> apex (scripts/host-redirects.mjs; same env names/order as lib/site.ts).
  // 2) old-site URLs -> closest new page (scripts/legacy-redirects.mjs). Host rules come first, then these.
  // 3) other spellings of the legal pages' addresses (scripts/legal-redirects.mjs).
  async redirects() {
    return [...hostRedirects(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || ""), ...legacyRedirects(), ...legalRedirects()];
  },
};

export default nextConfig;
