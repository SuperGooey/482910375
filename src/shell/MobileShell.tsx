import type { Dispatch } from "react";
import { ClipboardList, Phone, PhoneIncoming } from "lucide-react";
import { frostedStyle } from "../theme/styles";
import { CALLS, COMPLETED_CALLS, MISSED_CALLS } from "../data/mockData";
import { SegmentedControl } from "../components/primitives/SegmentedControl";
import { QueueScreen } from "../features/queue/QueueScreen";
import { MissedScreen } from "../features/missed/MissedScreen";
import { CompletedScreen } from "../features/completed/CompletedScreen";
import { CasesScreen } from "../features/cases/CasesScreen";
import { ScheduledView } from "../features/cases/ScheduledView";
import { CaseDetail } from "../features/cases/CaseDetail";
import { CallDetail } from "../features/call-detail/CallDetail";
import type { CallAction, CallState } from "../state/callState";
import type { Call, CaseRecord } from "../types";
import { queueOrCasesCountLabel, type CasesView, type QueueView, type Tab } from "./types";

// today's single-pane, full-screen-push mobile experience — unchanged from
// before the desktop split-pane layout existed. Below the `lg` breakpoint
// this is the entire app; above it, DesktopShell takes over instead.
export function MobileShell({
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
  return openCall && callState ? (
    <CallDetail
      call={openCall}
      state={callState}
      dispatch={callDispatch}
      onBack={() => setOpenCallId(null)}
      onViewJob={onViewJob}
    />
  ) : openCase ? (
    <CaseDetail kase={openCase} onBack={() => setOpenCaseId(null)} />
  ) : (
    <div className="relative flex-1 min-h-0">
      {/* scrollable content — sits full-bleed behind the header/footer, with
          padding just to clear them at rest; scrolling slides it underneath */}
      <div className="absolute inset-0 overflow-y-auto pb-20 pt-28">
        {tab === "queue" ? (
          queueView === "live" ? (
            <QueueScreen calls={CALLS} onOpen={setOpenCallId} />
          ) : queueView === "missed" ? (
            <MissedScreen calls={MISSED_CALLS} />
          ) : (
            <CompletedScreen calls={COMPLETED_CALLS} />
          )
        ) : casesView === "scheduled" ? (
          <ScheduledView cases={filteredCases} onOpen={setOpenCaseId} />
        ) : (
          <CasesScreen cases={filteredCases} onOpen={setOpenCaseId} />
        )}
      </div>

      {/* shared frosted backdrop behind the header text and the picker below it —
          sized to reach the picker's bottom edge so the fade lands there, not
          partway through */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: 104, ...frostedStyle("down") }}
      />

      {/* header text, no background of its own now — sits on the shared backdrop */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-4 flex items-center justify-between">
        <div className="text-[15px] font-bold">{tab === "queue" ? "Live queue" : "Jobs"}</div>
        <div className="flex items-center gap-1.5 text-[#6B7280] text-[12px]">
          <PhoneIncoming size={13} />
          {queueOrCasesCountLabel({
            tab,
            queueView,
            casesView,
            callsCount: CALLS.length,
            missedCount: MISSED_CALLS.length,
            completedCount: COMPLETED_CALLS.length,
            filteredCasesCount: filteredCases.length,
          })}
        </div>
      </div>

      {/* Live / Missed / Completed picker, or Active / Scheduled / Resolved for cases */}
      <div className="absolute left-0 right-0 z-10 px-4 pt-2 pb-4" style={{ top: 40, ...frostedStyle("down") }}>
        {tab === "queue" ? (
          <SegmentedControl
            variant="track"
            value={queueView}
            onChange={setQueueView}
            ariaLabel="Queue view"
            options={[
              { key: "live", label: "Live" },
              { key: "missed", label: "Missed" },
              { key: "completed", label: "History" },
            ]}
          />
        ) : (
          <SegmentedControl
            variant="track"
            value={casesView}
            onChange={setCasesView}
            ariaLabel="Jobs view"
            options={[
              { key: "active", label: "In progress" },
              { key: "scheduled", label: "Scheduled" },
              { key: "resolved", label: "Resolved" },
            ]}
          />
        )}
      </div>

      {/* floating footer: same treatment, fading upward into content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex pt-4" style={frostedStyle("up")}>
        <button
          onClick={() => setTab("queue")}
          className={`flex-1 flex flex-col items-center gap-1 pb-2.5 ${tab === "queue" ? "text-[#3B5BDB]" : "text-[#9AA0B0]"}`}
        >
          <Phone size={18} />
          <span className="text-[11px] font-medium">Queue</span>
        </button>
        <button
          onClick={() => setTab("cases")}
          className={`flex-1 flex flex-col items-center gap-1 pb-2.5 ${tab === "cases" ? "text-[#3B5BDB]" : "text-[#9AA0B0]"}`}
        >
          <ClipboardList size={18} />
          <span className="text-[11px] font-medium">Jobs</span>
        </button>
      </div>
    </div>
  );
}
