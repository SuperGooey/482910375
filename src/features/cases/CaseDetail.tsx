import { CheckCircle2, ChevronLeft, DollarSign, FileText, X } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { hashSeed } from "../../lib/geo";
import { MiniMap } from "../../components/map/MiniMap";
import { Card } from "../../components/primitives/Card";
import { Pill } from "../../components/primitives/Pill";
import { ContactCard } from "../../components/ContactCard";
import type { CaseRecord } from "../../types";
import { caseMapMode, statusStyle } from "./shared";

export function CaseDetail({
  kase,
  variant = "fullscreen",
  onBack,
}: {
  kase: CaseRecord;
  variant?: "fullscreen" | "panel";
  onBack: () => void;
}) {
  const isPanel = variant === "panel";
  // fullscreen sits directly on the page background; the panel variant sits
  // inside DetailPane's white elevated card instead — the hero fade needs to
  // fade to whichever of those it's actually over, or it shows a seam
  const surfaceRgb = isPanel ? "255,255,255" : "246,247,251";
  const s = statusStyle[kase.status];
  const dim = kase.status === "resolved";
  return (
    // panel mode gets the same ultra-wide backstop cap as CallDetail's panel
    // mode, and reflows the info cards into a 2-column grid (Status spanning
    // both) instead of a single stack — otherwise this much width just
    // leaves the cards looking sparse against a mostly-empty card
    <div className={`h-full flex flex-col ${isPanel ? "w-full max-w-[1200px] mx-auto" : ""}`}>
      {/* hero: map extends up behind the header and fades into the
          surrounding background before the content starts, instead of two
          stacked blocks */}
      <div className="relative shrink-0" style={{ height: 200 }}>
        <MiniMap seed={hashSeed(kase.id)} distancePct={22} mode={caseMapMode[kase.status]} dim={dim} latlng={kase.latlng} />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(${surfaceRgb},0) 0%, rgba(${surfaceRgb},0) 72%, rgb(${surfaceRgb}) 100%)`,
          }}
        />
        {/* pure blur gradient, single layer masked to fade — a continuous mask
            is smoother in principle than any number of discrete bands */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 136,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "-webkit-linear-gradient(top, black 0%, black 30%, transparent 100%)",
          }}
        />
        <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label={isPanel ? "Close" : "Back"}
            className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center"
          >
            {isPanel ? (
              <X size={16} className="text-[#454B5C]" />
            ) : (
              <ChevronLeft size={16} className="text-[#454B5C]" />
            )}
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-[#1E2233]">{kase.unit}</div>
            <div className="text-xs text-[#454B5C]">{kase.location}</div>
          </div>
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 -mt-8 ${isPanel ? "grid grid-cols-2 items-start gap-3" : "flex flex-col gap-3"}`}>
        <Card className={isPanel ? "col-span-2" : ""}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">Status</span>
            <Pill style={{ background: s.bg, color: s.fg }}>{s.label}</Pill>
          </div>
          {kase.meta && <div className="text-sm text-[#454B5C] mt-1">{kase.meta}</div>}
        </Card>
        {kase.contact && <ContactCard contact={kase.contact} />}
        {kase.contextItems && (
          <Card>
            <div className="flex items-center gap-1.5 mb-2 text-[#6B7280]">
              <FileText size={13} />
              <span className="text-[11px] font-medium uppercase tracking-wide">Context</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {kase.contextItems.map((a, i) => (
                <div key={i}>
                  <div className="text-[13px] font-semibold">{a.label}</div>
                  <div className="text-[12px] text-[#6B7280] leading-snug">{a.detail}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {kase.status === "resolved" && (
          <>
            <Card>
              <div className="flex items-center gap-1.5 mb-1 text-[#6B7280]">
                <FileText size={13} />
                <span className="text-[11px] font-medium uppercase tracking-wide">Outcome</span>
              </div>
              <div className="text-sm text-[#1E2233]">{kase.note}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-1.5 mb-1 text-[#6B7280]">
                <DollarSign size={13} />
                <span className="text-[11px] font-medium uppercase tracking-wide">Cost</span>
              </div>
              <div className="text-sm text-[#1E2233]">${kase.cost}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-1.5 mb-2 text-[#6B7280]">
                <CheckCircle2 size={13} />
                <span className="text-[11px] font-medium uppercase tracking-wide">Follow-up</span>
              </div>
              {kase.followUp ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[#1E2233]">{kase.followUpNote}</span>
                  <button
                    className="shrink-0 h-9 px-3 rounded-full text-[12px] font-semibold active:scale-95 transition-all"
                    style={{ backgroundColor: COLORS.accent, color: "#FFFFFF" }}
                  >
                    Mark done
                  </button>
                </div>
              ) : (
                <div className="text-sm text-[#6B7280]">Nothing outstanding.</div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
