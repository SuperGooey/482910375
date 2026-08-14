import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COLORS, urgencyDot } from "../../theme/colors";
import { displayName } from "../../lib/contact";
import { hashSeed } from "../../lib/geo";
import { MapCard } from "../../components/map/MapCard";
import { Pill } from "../../components/primitives/Pill";
import type { Call } from "../../types";

function whenPill(call: Call): string {
  if (call.mode === "schedule") return call.units[0].scheduledTime!;
  const eta = call.units[0].eta!;
  return `${eta} min · ${(eta * 0.4).toFixed(1)} mi`;
}

interface CallStageInfo {
  label: string;
  color: string;
  bg: string;
  icon: LucideIcon;
  pulse: boolean;
}

// the queue card's stage badge — collapses "what's this call's status" into one
// small indicator instead of a separate progress stepper + a separate flag badge
function callStage(c: Call): CallStageInfo {
  if (c.flag) {
    return { label: "Needs review", color: COLORS.danger, bg: COLORS.dangerBg, icon: AlertTriangle, pulse: true };
  }
  if (c.stage === "triaging") {
    return { label: "Triaging", color: COLORS.accent, bg: "white/90", icon: Activity, pulse: true };
  }
  if (c.stage === "dispatching") {
    return {
      label: c.mode === "schedule" ? "Scheduling" : "Dispatching",
      color: COLORS.accent,
      bg: "white/90",
      icon: Activity,
      pulse: true,
    };
  }
  return {
    label: c.mode === "schedule" ? "Scheduled" : "Dispatched",
    color: COLORS.success,
    bg: "white/90",
    icon: CheckCircle2,
    pulse: false,
  };
}

export function QueueScreen({ calls, onOpen }: { calls: Call[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {calls.map((c) => {
        const stage = callStage(c);
        const StageIcon = stage.icon;
        return (
          <MapCard
            key={c.id}
            as="button"
            onClick={() => onOpen(c.id)}
            height="h-32"
            seed={hashSeed(c.id)}
            distancePct={c.mode === "schedule" ? 20 : Math.min(38, (c.units[0].eta || 6) * 3)}
            mapMode={c.mode === "schedule" ? "siteOnly" : "live"}
            latlng={c.latlng}
            topGradient="via-white/75"
            bottomGradient="from-white/80"
          >
            <div className="absolute top-2.5 left-2.5">
              <Pill
                size={10}
                weight={600}
                style={{ color: stage.color, background: stage.bg.startsWith("#") ? stage.bg : "rgba(255,255,255,0.9)" }}
              >
                <StageIcon size={11} className={stage.pulse ? "animate-pulse" : ""} />
                {stage.label}
              </Pill>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{whenPill(c)}</Pill>
            </div>

            <div className="absolute bottom-2.5 left-3 right-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: urgencyDot[c.urgency] }} />
                <span className="text-sm font-semibold truncate text-[#1E2233]">{c.situation}</span>
              </div>
              <span className="text-xs text-[#6B7280]">
                {displayName(c.contact) ? `${displayName(c.contact)} · ${c.location}` : c.location}
              </span>
            </div>
          </MapCard>
        );
      })}
    </div>
  );
}
