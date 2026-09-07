"use client";

import React from "react";

interface PlayRoomFooterProps {
  roomId: string;
  isConnectedToSocket: boolean;
  isCountryVsTeam: boolean;
}

export function PlayRoomFooter({
  roomId,
  isConnectedToSocket,
  isCountryVsTeam,
}: PlayRoomFooterProps) {
  return (
    <footer className="py-4 border-t border-white/10 bg-[#0c1612]/70 backdrop-blur-md text-center text-xs text-zinc-400 flex items-center justify-between px-6 max-w-4xl w-full mx-auto">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnectedToSocket ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-amber-400"
          }`}
        />
        <span>{isConnectedToSocket ? "Canlı 1v1 Çok Oyunculu Aktif" : "Tek Oyunculu Mod"}</span>
      </div>
      <span>
        {isCountryVsTeam
          ? `Oda: #${roomId} • O milletten olup kulüpte forma giymiş futbolcuyu ilk yazan kazanır`
          : `Oda: #${roomId} • İki takımda da forma giymiş futbolcuyu en hızlı yazan kazanır`}
      </span>
    </footer>
  );
}
