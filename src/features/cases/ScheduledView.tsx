import { WEEK_DAYS } from "../../lib/schedule";
import type { CaseRecord } from "../../types";
import { TimelineBoard } from "./TimelineBoard";

export function ScheduledView({ cases, onOpen }: { cases: CaseRecord[]; onOpen: (id: string) => void }) {
  const technicians = Array.from(new Set(cases.map((k) => k.unit)));

  // opens scrolled to the first day that actually has jobs — the week-view
  // zoom level already shows the whole week, so there's no separate day
  // picker needed anymore
  const firstBusyDay = WEEK_DAYS.find((iso) => cases.some((k) => k.date === iso)) || WEEK_DAYS[0];

  return (
    <div className="flex flex-col gap-3 p-4">
      <TimelineBoard technicians={technicians} jobs={cases} onOpen={onOpen} focusDate={firstBusyDay} />
    </div>
  );
}
