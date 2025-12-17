import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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

export default withNextIntl(nextConfig);
