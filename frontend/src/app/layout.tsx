import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edura - Kurs Takip Sistemi",
  description: "Eğitim kurumları için kurs takip ve yönetim sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
