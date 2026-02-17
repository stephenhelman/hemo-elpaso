/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow build to succeed even with ESLint errors (for now)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to succeed even with TypeScript errors (for now)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
