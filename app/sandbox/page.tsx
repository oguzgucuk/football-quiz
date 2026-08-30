import React from "react";
import { Metadata } from "next";
import { SandboxPageClient } from "@/components/game/SandboxPageClient";

export const metadata: Metadata = {
  title: "Sandbox / Test Modu — Süresiz Futbol Quiz",
  description: "İstediğin iki takımı seç ve ortak futbolcuları süresiz olarak test et.",
};

export default function SandboxPage() {
  return <SandboxPageClient />;
}
