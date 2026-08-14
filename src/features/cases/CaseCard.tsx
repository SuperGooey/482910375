import { AlertTriangle } from "lucide-react";
import { displayName } from "../../lib/contact";
import { hashSeed } from "../../lib/geo";
import { MapCard } from "../../components/map/MapCard";
import { Pill } from "../../components/primitives/Pill";
import type { CaseRecord } from "../../types";
import { caseMapMode, statusStyle } from "./shared";

export function CaseCard({ k, onOpen }: { k: CaseRecord; onOpen: (id: string) => void }) {
  const s = statusStyle[k.status];
  const dim = k.status === "resolved";
  return (
    <MapCard
      as="button"
      onClick={() => onOpen(k.id)}
      height={k.status === "resolved" ? "h-32" : "h-28"}
      seed={hashSeed(k.id)}
      distancePct={22}
      mapMode={caseMapMode[k.status]}
      dim={dim}
      latlng={k.latlng}
      topGradient="via-white/75"
      bottomGradient="from-white/80"
    >
      <div className="absolute top-2.5 left-2.5">
        <Pill size={10} weight={600} style={{ background: s.bg, color: s.fg }}>
          {s.label}
        </Pill>
      </div>
      {k.status === "resolved" ? (
        <div className="absolute top-2.5 right-2.5">
          <span
            className="text-[17px] font-bold text-[#1E2233]"
            style={{ textShadow: "0 1px 3px rgba(255,255,255,0.9), 0 1px 3px rgba(255,255,255,0.9)" }}
          >
            ${k.cost}
          </span>
        </div>
      ) : (
        k.meta && (
          <div className="absolute top-2.5 right-2.5">
            <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{k.meta}</Pill>
          </div>
        )
      )}

      <div className="absolute bottom-2.5 left-3 right-3">
        <div className="text-sm font-semibold truncate text-[#1E2233]">{k.unit}</div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#6B7280]">
            {displayName(k.contact) ? `${displayName(k.contact)} · ${k.location}` : k.location}
          </span>
          {k.status === "resolved" && k.followUp && (
            <Pill size={10} weight={500} className="text-[#C98A1D] bg-[#FFF4DE] shrink-0">
              <AlertTriangle size={10} /> Follow-up
            </Pill>
          )}
        </div>
        {k.status === "resolved" && k.note && (
          <div className="text-[11px] text-[#454B5C] leading-snug truncate mt-0.5">{k.note}</div>
        )}
      </div>
    </MapCard>
  );
}
