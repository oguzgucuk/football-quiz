"use client";

import { Badge } from "@/components/ui/Badge";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TeamLineup } from "@/lib/auction/auctionTypes";
import { LayoutList } from "lucide-react";

const POSITION_GROUPS: Array<{ label: string; positions: string[] }> = [
  { label: "Hücum", positions: ["ST", "CF", "LW", "RW"] },
  { label: "Orta saha", positions: ["CAM", "CM", "CDM", "LM", "RM"] },
  { label: "Savunma", positions: ["CB", "LB", "RB", "LWB", "RWB"] },
  { label: "Kaleci", positions: ["GK"] },
];

function ratingStyle(rating?: number) {
  if (!rating) return "border-white/5 bg-black/20 text-zinc-500";
  if (rating >= 80) return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  if (rating >= 65) return "border-amber-300/25 bg-amber-500/10 text-amber-200";
  return "border-rose-300/20 bg-rose-500/10 text-rose-200";
}

interface TeamColumnProps {
  name: string;
  lineup?: TeamLineup;
  isCurrentUser: boolean;
}

function TeamColumn({ name, lineup, isCurrentUser }: TeamColumnProps) {
  const slots = lineup?.slots ?? [];

  return (
    <section className={`min-w-0 rounded-xl border p-2.5 ${isCurrentUser ? "border-emerald-400/35 bg-emerald-950/20" : "border-white/10 bg-black/15"}`}>
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <p className="truncate text-[11px] font-black uppercase tracking-wide text-white">{name}</p>
        <Badge variant={isCurrentUser ? "brand" : "default"} className="shrink-0 px-1.5 py-0 text-[9px]">
          {lineup?.formation ?? "Kadro yok"}
        </Badge>
      </div>

      <div className="space-y-2">
        {POSITION_GROUPS.map(({ label, positions }) => {
          const players = slots.filter((slot) => positions.includes(slot.targetPosition));
          if (!players.length) return null;

          return (
            <div key={label}>
              <p className="mb-1 text-[8px] font-black uppercase tracking-wide text-zinc-500">{label}</p>
              <div className="space-y-1">
                {players.map((slot) => {
                  const fullName = slot.placedPlayer?.fullName ?? "";
                  return (
                    <div key={slot.slotId} className="flex min-w-0 items-center gap-1.5 rounded-md border border-white/5 bg-black/20 px-1.5 py-1">
                      <Badge variant="default" className="shrink-0 border-white/10 px-1 py-0 text-[8px] text-zinc-300">
                        {slot.targetPosition}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-zinc-200">{fullName || "Boş"}</span>
                      <span className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-black ${ratingStyle(slot.effectiveRating)}`}>
                        {slot.effectiveRating || "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface MatchLineupDrawerProps {
  homeName: string;
  homeLineup?: TeamLineup;
  awayName: string;
  awayLineup?: TeamLineup;
  currentUserId?: string;
  homeUserId: string;
  awayUserId: string;
}

export function MatchLineupDrawer({
  homeName,
  homeLineup,
  awayName,
  awayLineup,
  currentUserId,
  homeUserId,
  awayUserId,
}: MatchLineupDrawerProps) {
  if (!homeLineup?.slots?.length && !awayLineup?.slots?.length) return null;

  const homeIsCurrentUser = homeUserId === currentUserId;
  const awayIsCurrentUser = awayUserId === currentUserId;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Kadroları göster"
          className="mt-1 inline-flex h-5 items-center gap-1 rounded-md border border-white/10 bg-black/35 px-1.5 text-[8px] font-black uppercase tracking-wide text-zinc-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-950/40 hover:text-emerald-200"
        >
          <LayoutList className="size-3" aria-hidden="true" />
          Kadrolar
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" sideOffset={8} collisionPadding={12} className="w-[min(92vw,540px)] rounded-xl border-emerald-400/25 p-2.5">
        <PopoverArrow className="fill-[#0e1319]" />
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white">Saha dizilişleri</p>
            <p className="text-[9px] text-zinc-500">Mevki ve efektif puan</p>
          </div>
          <LayoutList className="size-4 text-emerald-300" aria-hidden="true" />
        </div>
        <div className="custom-scrollbar grid max-h-[min(58vh,410px)] grid-cols-2 gap-2 overflow-y-auto pr-1">
          <TeamColumn name={homeName} lineup={homeLineup} isCurrentUser={homeIsCurrentUser} />
          <TeamColumn name={awayName} lineup={awayLineup} isCurrentUser={awayIsCurrentUser} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
