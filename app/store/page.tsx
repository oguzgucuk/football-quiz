import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Arena Mağazası — AC Paketleri & Özel Kartlar — AlimBALL",
  description:
    "AlimBALL Arena Mağazası: Sanal para birimi Arena Coins (AC) paketleri, özel avatar çerçeveleri ve kozmetik kart koleksiyonları.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    title: "Arena Mağazası — AC Paketleri & Özel Kartlar — AlimBALL",
    description:
      "AlimBALL Arena Mağazası: Arena Coins (AC) paketleri, özel avatar çerçeveleri ve kart koleksiyonları.",
    url: "/store",
  },
};

export default function StorePage() {
  return <DashboardShell initialTab="store" />;
}
