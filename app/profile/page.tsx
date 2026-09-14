import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Oyuncu Profili & Kariyer İstatistikleri — AlimBALL",
  description:
    "AlimBALL oyuncu profili: ELO puanı, kazanılan 1v1 maçlar, lig sıralaması ve maç geçmişi.",
  alternates: {
    canonical: "/profile",
  },
  openGraph: {
    title: "Oyuncu Profili & Kariyer İstatistikleri — AlimBALL",
    description:
      "AlimBALL oyuncu profili: ELO puanı, kazanılan 1v1 maçlar ve maç geçmişi.",
    url: "/profile",
  },
};

export default function ProfilePage() {
  return <DashboardShell initialTab="profile" />;
}
