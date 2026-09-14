import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "AlimBALL — Canlı 1v1 Futbol Quiz & Kadro Kurma Arenası",
  description:
    "AlimBALL: Gerçek zamanlı 1v1 futbol bilgi düellosu, canlı müzayede transfer pazarı, ortak futbolcu bulmaca ve 18.000+ oyuncu veritabanı. Hemen ücretsiz oyna!",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AlimBALL — Canlı 1v1 Futbol Quiz & Kadro Kurma Arenası",
    description:
      "AlimBALL: Gerçek zamanlı 1v1 futbol bilgi düellosu, canlı müzayede transfer pazarı, ortak futbolcu bulmaca ve 18.000+ oyuncu veritabanı.",
    url: "/",
  },
};

export default function Page() {
  return <DashboardShell initialTab="play" />;
}
