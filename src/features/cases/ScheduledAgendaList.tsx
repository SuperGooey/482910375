import { Clock } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { displayName } from "../../lib/contact";
import { initials, parseTimeToMinutes, WEEK_DAYS } from "../../lib/schedule";
import { SquircleCard } from "../../components/primitives/SquircleCard";
import type { CaseRecord } from "../../types";

// desktop's list-pane counterpart to the gantt chart (which moves to the
// wide elevated detail panel instead — a timeline wants width, a list pane
// wants scannable rows). Deliberately flat, bordered rows rather than
// another map-card: the queue list and the Team column already use
// map-styled cards, and a third repetition of that same look here would
// blend everything together instead of reading as a distinct agenda.
export function ScheduledAgendaList({
  cases,
  onOpen,
  activeId = null,
}: {
  cases: CaseRecord[];
  onOpen: (id: string) => void;
  activeId?: string | null;
}) {
  const byDate = new Map<string, CaseRecord[]>();
  for (const k of cases) {
    if (!k.date) continue;
    const list = byDate.get(k.date);
    if (list) list.push(k);
    else byDate.set(k.date, [k]);
  }
  const days = WEEK_DAYS.filter((iso) => byDate.has(iso));

  if (days.length === 0) {
    return (
      <div className="text-[13px] text-center px-6 py-10" style={{ color: COLORS.faint }}>
        Nothing scheduled this week.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {days.map((iso) => {
        const dayCases = [...byDate.get(iso)!].sort(
          (a, b) => parseTimeToMinutes(a.time || "") - parseTimeToMinutes(b.time || "")
        );
        const d = new Date(`${iso}T00:00:00`);
        return (
          <div key={iso} className="flex flex-col gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide px-1" style={{ color: COLORS.muted }}>
              {d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </div>
            <div className="flex flex-col gap-2">
              {dayCases.map((k) => (
                <AgendaRow key={k.id} kase={k} active={k.id === activeId} onOpen={onOpen} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaRow({ kase, active, onOpen }: { kase: CaseRecord; active: boolean; onOpen: (id: string) => void }) {
  return (
    <SquircleCard
      as="button"
      radius={16}
      onClick={() => onOpen(kase.id)}
      className="text-left p-3 flex items-center gap-3 bg-white active:scale-[0.99] transition-all"
      borderColor={active ? COLORS.accent : undefined}
      borderWidth={active ? 2 : undefined}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ backgroundColor: COLORS.accent }}
      >
        {initials(kase.unit)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1E2233]">
          <Clock size={11} style={{ color: COLORS.muted }} />
          {kase.time}
        </div>
        <div className="text-[12px] text-[#6B7280] truncate">
          {displayName(kase.contact) ? `${displayName(kase.contact)} · ` : ""}
          {kase.location}
        </div>
      </div>
    </SquircleCard>
  );
}
