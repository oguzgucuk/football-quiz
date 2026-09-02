"use client";

import React from "react";
import { Trophy, Swords, LayoutGrid } from "lucide-react";

type ModeRailProps = {
  selectedCategory: string;
  onSelect: (id: string) => void;
};

export function ModeRail({ selectedCategory, onSelect }: ModeRailProps) {
  const menuItems = [
    { id: "ranked", name: "Dereceli Modlar", icon: Trophy },
    { id: "custom", name: "Arkadaşınla Oyna", icon: Swords },
    { id: "unranked", name: "Derecesiz Modlar", icon: LayoutGrid },
  ];

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-[#e2e8e4] bg-white select-none shadow-sm">
      <nav className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3 pt-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === selectedCategory;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                active
                  ? "border-[#15803d]/40 bg-[#15803d]/10 shadow-sm"
                  : "border-transparent hover:border-[#e2e8e4] hover:bg-[#f5f8f6]"
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  active
                    ? "bg-[#15803d] text-white shadow-sm"
                    : "bg-[#eef3f0] text-[#6b7770] group-hover:text-[#141b16]"
                }`}
              >
                <Icon className="size-5" />
              </span>
              <span className={`truncate text-[13px] font-black uppercase tracking-wider flex-1 ${
                active ? "text-[#15803d]" : "text-[#141b16]"
              }`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Alt: Günlük Görev Kartı */}
      <div className="mx-2.5 mb-3 rounded-xl border border-[#e2e8e4] bg-[#f5f8f6] p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#6b7770]">Günlük Görev</p>
        <p className="mt-1 text-xs font-bold text-[#141b16]">3 maç oyna</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8e4]">
          <div className="h-full w-2/3 rounded-full bg-[#15803d]" />
        </div>
        <p className="mt-1.5 text-[10px] text-[#6b7770] font-mono">2 / 3 tamamlandı</p>
      </div>
    </aside>
  );
}
