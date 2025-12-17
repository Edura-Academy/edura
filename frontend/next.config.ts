import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages için gerekli ayarlar
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Resim optimizasyonu Cloudflare'de farklı çalışır
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
