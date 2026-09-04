import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "PITCH — Futbol Quiz & Scout Arena",
  description:
    "Gerçek zamanlı 1v1 futbol bilgi yarışı. İki takım seçin, her iki kulüpte de forma giymiş ortak futbolcuyu en hızlı yazarak turları kazanın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased dark">
      <body
        className={`${outfit.variable} ${geistMono.variable} min-h-full flex flex-col font-sans bg-[#0d1611] text-white selection:bg-emerald-500/30 selection:text-emerald-300`}
      >
        {children}
      </body>
    </html>
  );
}
