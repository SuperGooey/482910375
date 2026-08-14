import { Clock } from "lucide-react";
import { matchColors } from "../../theme/colors";
import { hashSeed } from "../../lib/geo";
import { nextFreeLabel, unitSchedule } from "../../lib/schedule";
import { MiniMap } from "../../components/map/MiniMap";
import { Pill } from "../../components/primitives/Pill";
import { SquircleCard } from "../../components/primitives/SquircleCard";
import type { CallUnit, LatLng } from "../../types";

export function UnitCard({ u, centerLatLng }: { u: CallUnit; centerLatLng: LatLng }) {
  const c = matchColors(u.match);
  const slots = unitSchedule(u.id);
  const seed = hashSeed(u.id);
  const distancePct = Math.min(38, (u.eta || 6) * 3);
  return (
    <SquircleCard radius={18} className="overflow-hidden bg-white">
      <div className="relative h-16">
        <MiniMap seed={seed} distancePct={distancePct} mode="live" latlng={centerLatLng} />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 to-transparent" />
        <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
          <span className="text-[13px] font-semibold truncate">{u.id}</span>
          <Pill className="bg-white/90 text-[#6B7280] shrink-0">{u.tag}</Pill>
        </div>
        <div className="absolute top-1.5 right-2">
          <Pill className="bg-white/90 shrink-0" style={{ color: c.fg }}>
            {u.match}%
          </Pill>
        </div>
      </div>
      <div className="px-2.5 py-2 bg-[#FAFAFC]">
        <div className="flex items-center gap-1 mb-1.5">
          {slots.map((free, i) => (
            <span key={i} className="flex-1 h-1.5 rounded-full" style={{ background: free ? "#D9F2E6" : "#E7E8F1" }} />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {u.eta != null ? `${u.eta} min away` : u.scheduledTime}
          </span>
          <span>{nextFreeLabel(slots)}</span>
        </div>
      </div>
    </SquircleCard>
  );
}
