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
};

export default nextConfig;
