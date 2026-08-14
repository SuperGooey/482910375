import { PhoneOff } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { displayName } from "../../lib/contact";
import { hashSeed } from "../../lib/geo";
import { MapCard } from "../../components/map/MapCard";
import { Pill } from "../../components/primitives/Pill";
import type { MissedCall } from "../../types";

export function MissedScreen({ calls }: { calls: MissedCall[] }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {calls.map((m) => (
        <MapCard
          key={m.id}
          height="h-28"
          seed={hashSeed(m.id)}
          distancePct={20}
          mapMode="siteOnly"
          dim
          latlng={m.latlng}
          topGradient="via-white/80"
          bottomGradient="from-white/60"
        >
          <div className="absolute top-2.5 left-2.5">
            <Pill size={10} weight={600} className="text-[#E4534B]" style={{ backgroundColor: COLORS.dangerBg }}>
              <PhoneOff size={10} /> Missed
            </Pill>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{m.missedAt}</Pill>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate text-[#1E2233]">
                {displayName(m.contact, m.situation)}
              </div>
              <div className="text-xs text-[#6B7280] truncate">{m.reason} · {m.location}</div>
            </div>
            <button
              className="shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold active:scale-95 transition-all"
              style={{ backgroundColor: COLORS.accent, color: "#FFFFFF" }}
            >
              Call back
            </button>
          </div>
        </MapCard>
      ))}
    </div>
  );
}
