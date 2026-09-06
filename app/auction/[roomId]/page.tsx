import React from "react";
import { Metadata } from "next";
import { AuctionRoomClient } from "@/components/auction/AuctionRoomClient";

interface AuctionPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export async function generateMetadata({ params }: AuctionPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Müzayede Odası #${roomId} — Canlı Futbol Açık Artırması`,
    description: "Futbolcu pazarından kadronu topla, dizilişini yap ve lig simülasyonunda yarış!",
  };
}

export default async function AuctionPage({ params }: AuctionPageProps) {
  const { roomId } = await params;

  return <AuctionRoomClient roomId={roomId} />;
}
