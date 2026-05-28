/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16: the `eslint` config key is removed — `next build` no longer
  // runs linting. Use `npm run lint` (eslint CLI) directly when you want it.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
