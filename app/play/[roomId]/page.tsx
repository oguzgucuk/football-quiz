import React from "react";
import { Metadata } from "next";
import { PlayRoomClient } from "@/components/game/PlayRoomClient";

interface PlayPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Oda #${roomId} — 1v1 Futbol Quiz Düellosu`,
    description: "Takımını seç, ortak futbolcuyu en hızlı yazarak turu kazan!",
  };
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { roomId } = await params;

  return <PlayRoomClient roomId={roomId} />;
}
