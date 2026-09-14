import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Liderlik Panosu & Sezon Sıralaması — AlimBALL",
  description:
    "AlimBALL küresel sıralama, en yüksek ELO dereceleri ve 1. Sezon lig liderlik tablosu.",
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title: "Liderlik Panosu & Sezon Sıralaması — AlimBALL",
    description:
      "AlimBALL küresel sıralama, en yüksek ELO dereceleri ve sezon liderlik tablosu.",
    url: "/dashboard",
  },
};

export default function DashboardPage() {
  return <DashboardShell initialTab="home" />;
}
