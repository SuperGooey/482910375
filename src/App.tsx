import { useEffect, useState } from "react";
import { ClipboardList, Phone, PhoneIncoming } from "lucide-react";
import { COLORS } from "./theme/colors";
import { frostedStyle } from "./theme/styles";
import { CALLS, CASES, COMPLETED_CALLS, MISSED_CALLS } from "./data/mockData";
import { SegmentedControl } from "./components/primitives/SegmentedControl";
import { QueueScreen } from "./features/queue/QueueScreen";
import { MissedScreen } from "./features/missed/MissedScreen";
import { CompletedScreen } from "./features/completed/CompletedScreen";
import { CasesScreen } from "./features/cases/CasesScreen";
import { ScheduledView } from "./features/cases/ScheduledView";
import { CaseDetail } from "./features/cases/CaseDetail";
import { CallDetail } from "./features/call-detail/CallDetail";

type Tab = "queue" | "cases";
type QueueView = "live" | "missed" | "completed";
type CasesView = "active" | "scheduled" | "resolved";

// ---------------- App shell ----------------
export default function DispatchConsole() {
  const [tab, setTab] = useState<Tab>("queue");
  const [queueView, setQueueView] = useState<QueueView>("live");
  const [casesView, setCasesView] = useState<CasesView>("active");
  const [openCallId, setOpenCallId] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);

  useEffect(() => {
    // some mobile browsers/webviews auto-invert colors for system dark mode
    // when a page doesn't declare its own scheme, which can override author
    // colors unpredictably. This opts the whole preview out of that.
    let meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "light";
    return () => {
      if (created) meta!.remove();
      else meta!.content = prev;
    };
  }, []);

  const openCall = CALLS.find((c) => c.id === openCallId);
  const openCase = CASES.find((k) => k.id === openCaseId);
  const filteredCases = CASES.filter((k) =>
    casesView === "active" ? k.status === "en_route" || k.status === "on_scene" : k.status === casesView
  );

  return (
    <div
      className="font-sans text-[#1E2233] h-screen max-w-md mx-auto flex flex-col overflow-hidden border-x border-[#ECEEF5]"
      style={{ colorScheme: "light", backgroundColor: COLORS.page }}
    >
      {openCall ? (
        <CallDetail
          call={openCall}
          onBack={() => setOpenCallId(null)}
          onViewJob={(caseId) => {
            setOpenCallId(null);
            setOpenCaseId(caseId);
          }}
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
              {tab === "cases"
                ? `${filteredCases.length} ${casesView === "active" ? "in progress" : casesView}`
                : queueView === "live"
                ? `${CALLS.length} active`
                : queueView === "missed"
                ? `${MISSED_CALLS.length} missed`
                : `${COMPLETED_CALLS.length} in history`}
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
      )}
    </div>
  );
}
