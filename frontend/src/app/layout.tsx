import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edura - Eğitim Yönetim Sistemi",
  description: "Modern eğitim yönetim platformu - Öğrenci, öğretmen ve veli takip sistemi",
  manifest: "/manifest.json",
  metadataBase: new URL("https://myedura.com"),
  openGraph: {
    title: "Edura - Eğitim Yönetim Sistemi",
    description: "Modern eğitim yönetim platformu - Öğrenci, öğretmen ve veli takip sistemi",
    url: "https://myedura.com",
    siteName: "Edura",
    images: [
      {
        url: "/logos/Edura-logo-gradient.png",
        width: 512,
        height: 512,
        alt: "Edura Logo",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edura - Eğitim Yönetim Sistemi",
    description: "Modern eğitim yönetim platformu - Öğrenci, öğretmen ve veli takip sistemi",
    images: ["/logos/Edura-logo-gradient.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Edura",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logos/Edura-logo-gradient.png", sizes: "any", type: "image/png" },
      { url: "/logos/Edura-logo-gradient-lower-res.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/logos/Edura-logo-gradient.png",
    apple: [
      { url: "/logos/Edura-logo-gradient.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logos/Edura-logo-gradient.png" />
        <link rel="apple-touch-icon" href="/logos/Edura-logo-gradient.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
