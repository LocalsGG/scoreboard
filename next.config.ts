import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] || "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Optimize image formats to reduce egress
    formats: ['image/avif', 'image/webp'],
    // Optimize device sizes to reduce bandwidth
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Enable image optimization (default is true, but explicitly set for clarity)
    minimumCacheTTL: 86400, // Cache optimized images for 24 hours
  },
};

export default nextConfig;
