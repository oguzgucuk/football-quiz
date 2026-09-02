"use client";

import React from "react";
import Link from "next/link";
import { Bell, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NerdBallLogo } from "@/components/ui/NerdBallLogo";

const navItems = ["OYNA", "PROFİL", "KADRO", "MAĞAZA", "KULÜP"];

export function TopBar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2e8e4] bg-white px-4 z-30 select-none shadow-sm relative">
      {/* Sol: Logo */}
      <div className="flex w-1/3 items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#15803d] text-white shadow-sm font-black text-base">
            A
          </div>
          <span className="text-xl font-black tracking-widest text-[#141b16]">
            ALİMBALL
          </span>
        </Link>
      </div>

      {/* Orta: Navigasyon Sekmeleri */}
      <div className="flex flex-1 justify-center">
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item, i) => (
            <button
              key={item}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-black tracking-wider transition-colors uppercase ${
                i === 0
                  ? "bg-[#15803d]/10 text-[#15803d]"
                  : "text-[#6b7770] hover:bg-[#f0f4f2] hover:text-[#141b16]"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* Sağ: Bildirim & Ayarlar */}
      <div className="flex w-1/3 items-center justify-end gap-1 text-[#6b7770]">
        <button className="rounded-lg p-2 transition-colors hover:bg-[#f0f4f2] hover:text-[#141b16]">
          <Bell className="size-4" />
        </button>
        <button className="rounded-lg p-2 transition-colors hover:bg-[#f0f4f2] hover:text-[#141b16]">
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
}
