import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Futbol Quiz — Ortak Futbolcuyu İlk Bulan Kazanır!",
  description:
    "Gerçek zamanlı 1v1 futbol bilgi yarışı. İki takım seçin, her iki kulüpte de forma giymiş ortak futbolcuyu en hızlı yazarak turları kazanın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark h-full antialiased">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col font-sans bg-[#090a0f] text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200`}
      >
        {children}
      </body>
    </html>
  );
}
