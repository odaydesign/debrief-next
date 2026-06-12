/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16: the `eslint` config key is removed — `next build` no longer
  // runs linting. Use `npm run lint` (eslint CLI) directly when you want it.
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // The service worker must never be cached, or updates can't roll out.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
