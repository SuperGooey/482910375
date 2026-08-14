import type { Dispatch } from "react";
import { CALLS, COMPLETED_CALLS, MISSED_CALLS } from "../data/mockData";
import { WEEK_DAYS } from "../lib/schedule";
import { QueueScreen } from "../features/queue/QueueScreen";
import { MissedScreen } from "../features/missed/MissedScreen";
import { CompletedScreen } from "../features/completed/CompletedScreen";
import { CasesScreen } from "../features/cases/CasesScreen";
import { ScheduledAgendaList } from "../features/cases/ScheduledAgendaList";
import { TimelineBoard } from "../features/cases/TimelineBoard";
import type { CallAction, CallState } from "../state/callState";
import type { Call, CaseRecord } from "../types";
import { queueOrCasesCountLabel, type CasesView, type QueueView, type Tab } from "./types";
import { Sidebar } from "./Sidebar";
import { ListPaneHeader } from "./ListPaneHeader";
import { DetailPane } from "./DetailPane";

// sidebar + a single-column list pane (not a card grid — matches the
// master-detail convention of keeping the "which one is open" highlight
// legible) + a docked detail panel, for screens >= the `lg` breakpoint.
export function DesktopShell({
  tab,
  setTab,
  queueView,
  setQueueView,
  casesView,
  setCasesView,
  openCall,
  openCase,
  callState,
  callDispatch,
  filteredCases,
  setOpenCallId,
  setOpenCaseId,
  onViewJob,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  queueView: QueueView;
  setQueueView: (view: QueueView) => void;
  casesView: CasesView;
  setCasesView: (view: CasesView) => void;
  openCall: Call | undefined;
  openCase: CaseRecord | undefined;
  callState: CallState | null;
  callDispatch: Dispatch<CallAction>;
  filteredCases: CaseRecord[];
  setOpenCallId: (id: string | null) => void;
  setOpenCaseId: (id: string | null) => void;
  onViewJob: (caseId: string) => void;
}) {
  const activeCallId = openCall?.id ?? null;
  const activeCaseId = openCase?.id ?? null;
  const isScheduledView = tab === "cases" && casesView === "scheduled";

  // the gantt chart's home moves here on desktop instead of the list pane —
  // a timeline wants width, which the elevated detail panel actually has.
  // Only relevant (and only computed) when the Scheduled sub-view is active.
  let scheduleFallback;
  if (isScheduledView) {
    const technicians = Array.from(new Set(filteredCases.map((k) => k.unit)));
    const firstBusyDay = WEEK_DAYS.find((iso) => filteredCases.some((k) => k.date === iso)) || WEEK_DAYS[0];
    scheduleFallback = (
      <div className="h-full min-h-0 overflow-y-auto p-5 flex flex-col gap-3">
        <div className="text-[15px] font-bold shrink-0">Schedule</div>
        <TimelineBoard technicians={technicians} jobs={filteredCases} onOpen={setOpenCaseId} focusDate={firstBusyDay} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex w-full">
      <Sidebar tab={tab} onChange={setTab} />

      <div className="w-[400px] shrink-0 h-full min-h-0 flex flex-col">
        <ListPaneHeader
          tab={tab}
          queueView={queueView}
          setQueueView={setQueueView}
          casesView={casesView}
          setCasesView={setCasesView}
          countLabel={queueOrCasesCountLabel({
            tab,
            queueView,
            casesView,
            callsCount: CALLS.length,
            missedCount: MISSED_CALLS.length,
            completedCount: COMPLETED_CALLS.length,
            filteredCasesCount: filteredCases.length,
          })}
        />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {tab === "queue" ? (
            queueView === "live" ? (
              <QueueScreen calls={CALLS} onOpen={setOpenCallId} activeId={activeCallId} />
            ) : queueView === "missed" ? (
              <MissedScreen calls={MISSED_CALLS} />
            ) : (
              <CompletedScreen calls={COMPLETED_CALLS} />
            )
          ) : isScheduledView ? (
            <ScheduledAgendaList cases={filteredCases} onOpen={setOpenCaseId} activeId={activeCaseId} />
          ) : (
            <CasesScreen cases={filteredCases} onOpen={setOpenCaseId} activeId={activeCaseId} />
          )}
        </div>
      </div>

      <DetailPane
        openCall={openCall}
        openCase={openCase}
        callState={callState}
        callDispatch={callDispatch}
        onCloseCall={() => setOpenCallId(null)}
        onCloseCase={() => setOpenCaseId(null)}
        onViewJob={onViewJob}
        fallback={scheduleFallback}
      />
    </div>
  );
}
