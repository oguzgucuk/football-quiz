import type { Metadata, Viewport } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/JsonLd";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alimball.com";

export const viewport: Viewport = {
  themeColor: "#0a120e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AlimBALL — Canlı 1v1 Futbol Quiz & Kadro Kurma Arenası",
    template: "%s | AlimBALL",
  },
  description:
    "AlimBALL: Gerçek zamanlı 1v1 futbol bilgi yarışı, transfer pazarı açık artırması ve 18.000+ futbolcu veritabanı. Ortak futbolcuları bul, kadronu kur ve yarış!",
  applicationName: "AlimBALL",
  authors: [{ name: "AlimBALL Team" }],
  creator: "AlimBALL",
  publisher: "AlimBALL",
  keywords: [
    "alimball",
    "futbol quiz",
    "futbol bilgi yarışması",
    "ortak futbolcu",
    "ortak oyuncu bulmaca",
    "futbol açık artırma",
    "kadro kurma",
    "transfermarkt quiz",
    "fifa reytingleri",
    "scout veritabanı",
    "futbol oyunu",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: baseUrl,
    siteName: "AlimBALL",
    title: "AlimBALL — Canlı 1v1 Futbol Quiz & Kadro Kurma Arenası",
    description:
      "AlimBALL: Gerçek zamanlı 1v1 futbol bilgi yarışı, transfer pazarı açık artırması ve 18.000+ futbolcu veritabanı.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AlimBALL — Canlı 1v1 Futbol Quiz & Kadro Kurma Arenası",
    description:
      "AlimBALL: Gerçek zamanlı 1v1 futbol bilgi yarışı, transfer pazarı açık artırması ve 18.000+ futbolcu veritabanı.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased dark">
      <head>
        <JsonLd baseUrl={baseUrl} />
      </head>
      <body
        className={`${outfit.variable} ${geistMono.variable} min-h-full flex flex-col font-sans bg-[#0d1611] text-white selection:bg-emerald-500/30 selection:text-emerald-300`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
