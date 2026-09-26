import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname),
  devIndicators: false,

  /* ——— Image optimization ———
   * Unsplash يُخدَم عبر next/image فيُقلَّص ويُحوَّل WebP/AVIF ويُخزَّن مؤقتاً.
   * سجّل بيئات أخرى هنا عند الحاجة. */
  images: {
    minimumCacheTTL: 2678400, // 31 يوماً
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 200, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
