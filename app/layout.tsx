import type { Metadata, Viewport } from "next";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.app,
  description: "Xerophis — modern private messaging platform.",
  applicationName: BRAND.app,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/xerophis-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  authors: [{ name: BRAND.developer }],
  openGraph: {
    title: BRAND.app,
    description: "Xerophis — modern private messaging platform.",
    images: [{ url: "/xerophis-logo.png", width: 512, height: 512, alt: "Xerophis" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050707",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
