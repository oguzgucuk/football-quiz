import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Hesap & Oyun Ayarları — AlimBALL",
  description:
    "AlimBALL oyun ve hesap tercihleri, ses ve bildirim ayarları.",
  alternates: {
    canonical: "/settings",
  },
  openGraph: {
    title: "Hesap & Oyun Ayarları — AlimBALL",
    description: "AlimBALL oyun ve hesap tercihleri.",
    url: "/settings",
  },
};

export default function SettingsPage() {
  return <DashboardShell initialTab="settings" />;
}
