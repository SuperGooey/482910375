import { PhoneIncoming } from "lucide-react";
import { SegmentedControl } from "../components/primitives/SegmentedControl";
import type { CasesView, QueueView, Tab } from "./types";

// list-pane title + count + the Live/Missed/History (or In progress/
// Scheduled/Resolved) sub-view control, for the desktop shell. Not shared
// with MobileShell — that header floats/frosts over scrolling content in a
// way this plain in-flow one doesn't need to, so forcing one component to
// cover both would mean threading floating-vs-static styling through props
// for no real reuse benefit; queueOrCasesCountLabel is the part actually
// worth sharing, and both headers already do.
export function ListPaneHeader({
  tab,
  queueView,
  setQueueView,
  casesView,
  setCasesView,
  countLabel,
}: {
  tab: Tab;
  queueView: QueueView;
  setQueueView: (view: QueueView) => void;
  casesView: CasesView;
  setCasesView: (view: CasesView) => void;
  countLabel: string;
}) {
  return (
    <div className="px-5 pt-6 pb-3 flex flex-col gap-3 shrink-0">
      <div className="flex items-center justify-between">
        <div className="text-[17px] font-bold">{tab === "queue" ? "Live queue" : "Jobs"}</div>
        <div className="flex items-center gap-1.5 text-[#6B7280] text-[12px]">
          <PhoneIncoming size={13} />
          {countLabel}
        </div>
      </div>
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
  );
}
