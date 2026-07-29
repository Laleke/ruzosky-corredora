import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaUpdateBanner } from "@/components/pwa-update-banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RZK Prop",
  description: "Administración inmobiliaria centralizada",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RZK Prop",
  },
};

export const viewport: Viewport = {
  themeColor: "#34343d",
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
    <html lang="es" className={inter.variable}>
      <body>
        <PwaUpdateBanner>{children}</PwaUpdateBanner>
      </body>
    </html>
  );
}
