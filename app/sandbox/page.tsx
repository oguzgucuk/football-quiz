import React from "react";
import { Metadata } from "next";
import { SandboxPageClient } from "@/components/game/SandboxPageClient";

export const metadata: Metadata = {
  title: "Süresiz Antrenman & Sandbox Modu — AlimBALL",
  description:
    "İstediğin iki dünya kulübünü serbestçe seç, süre baskısı olmadan aralarındaki tüm ortak futbolcuları bul ve futbol hafızanı güçlendir.",
  alternates: {
    canonical: "/sandbox",
  },
  openGraph: {
    title: "Süresiz Antrenman & Sandbox Modu — AlimBALL",
    description:
      "İstediğin iki dünya kulübünü serbestçe seç, süre baskısı olmadan aralarındaki tüm ortak futbolcuları bul.",
    url: "/sandbox",
  },
};

export default function SandboxPage() {
  return <SandboxPageClient />;
}
