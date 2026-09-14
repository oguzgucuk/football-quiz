import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Futbolcu Veritabanı & Scout Gezgini | 18.000+ Oyuncu — AlimBALL",
  description:
    "18.000'den fazla futbolcunun kariyer geçmişi, oynadığı takımlar, mevkileri ve prime FIFA reytingleri. AlimBALL futbolcu scout veritabanını keşfet.",
  alternates: {
    canonical: "/players",
  },
  openGraph: {
    title: "Futbolcu Veritabanı & Scout Gezgini | 18.000+ Oyuncu — AlimBALL",
    description:
      "18.000'den fazla futbolcunun kariyer geçmişi, oynadığı takımlar, mevkileri ve prime FIFA reytingleri.",
    url: "/players",
  },
};

export default function PlayersPage() {
  return <DashboardShell initialTab="players" />;
}
