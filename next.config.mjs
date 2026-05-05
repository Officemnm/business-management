/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for better dev experience
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Remove powered-by header for security + smaller response
  poweredByHeader: false,

  // Production source maps off for smaller bundles
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental performance features
  experimental: {
    // Tree-shake large icon/animation libraries (massive bundle reduction)
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "react-hot-toast",
    ],
  },

  // Strip console logs in production (keeps error/warn)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Long-term caching headers for static assets + security headers
  async headers() {
    return [
      {
        source: "/:path*\\.(jpg|jpeg|png|webp|avif|svg|ico|gif|woff|woff2|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
