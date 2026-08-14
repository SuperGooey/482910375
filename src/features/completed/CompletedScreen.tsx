import { COLORS } from "../../theme/colors";
import { displayName } from "../../lib/contact";
import { hashSeed } from "../../lib/geo";
import { MapCard } from "../../components/map/MapCard";
import { Pill } from "../../components/primitives/Pill";
import type { CompletedCall, CompletedCallStatus } from "../../types";

const completedStatusStyle: Record<CompletedCallStatus, { label: string; bg: string; fg: string }> = {
  scheduled: { label: "Scheduled", bg: "#F1EEFD", fg: "#7C5CE0" },
  resolved: { label: "Resolved", bg: COLORS.successBg, fg: COLORS.success },
  callback: { label: "Callback needed", bg: COLORS.warningBg, fg: COLORS.warning },
};

export function CompletedScreen({ calls }: { calls: CompletedCall[] }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {calls.map((d) => {
        const s = completedStatusStyle[d.status];
        return (
          <MapCard
            key={d.id}
            height="h-32"
            seed={hashSeed(d.id)}
            distancePct={18}
            mapMode="siteOnly"
            dim
            latlng={d.latlng}
            topGradient="via-white/85"
            bottomGradient="from-white/60"
          >
            <div className="absolute top-2.5 left-2.5">
              <Pill size={10} weight={600} style={{ backgroundColor: s.bg, color: s.fg }}>
                {s.label}
              </Pill>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{d.completedAt} · {d.duration}</Pill>
            </div>

            <div className="absolute bottom-2.5 left-3 right-3">
              <div className="text-sm font-semibold truncate text-[#1E2233]">{d.situation}</div>
              <div className="text-xs text-[#6B7280] truncate mb-1">
                {displayName(d.contact) ? `${displayName(d.contact)} · ` : ""}
                {d.location}
              </div>
              <div className="text-[11px] text-[#454B5C] leading-snug truncate">{d.outcome}</div>
            </div>
          </MapCard>
        );
      })}
    </div>
  );
}
