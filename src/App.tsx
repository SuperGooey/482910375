import { useEffect, useState } from "react";
import { COLORS } from "./theme/colors";
import { CALLS, CASES } from "./data/mockData";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useCallDetailState } from "./state/callState";
import { MobileShell } from "./shell/MobileShell";
import { DesktopShell } from "./shell/DesktopShell";
import { casesViewForStatus, type CasesView, type QueueView, type Tab } from "./shell/types";

// screens >= this width get the desktop split-pane shell instead of the
// mobile single-pane one — must match Tailwind's `lg:` breakpoint (Tailwind
// v4 has no JS config to import this from, so it's a small accepted
// duplication, same as COLORS vs. the CSS @theme block).
const DESKTOP_QUERY = "(min-width: 1024px)";

// ---------------- App shell ----------------
export default function DispatchConsole() {
  const [tab, setTab] = useState<Tab>("queue");
  const [queueView, setQueueView] = useState<QueueView>("live");
  const [casesView, setCasesView] = useState<CasesView>("active");
  const [openCallId, setOpenCallId] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

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

  // lives here, above the mobile/desktop shell swap, so resizing across that
  // breakpoint mid-call doesn't reset the call clock, transcript, or
  // confirmation state — see state/callState.ts's useCallDetailState
  const [callState, callDispatch] = useCallDetailState(openCall ?? null);

  // switching tabs/sub-views clears whatever's docked in the detail pane —
  // otherwise, e.g., navigating from "In progress" to "Missed" would leave a
  // stale, no-longer-listed case sitting in the panel. On mobile this is a
  // no-op: the tab/sub-view controls aren't even reachable while something's
  // open there (the full-screen detail view replaces them entirely), so
  // openCallId/openCaseId are already null by the time these ever fire.
  const handleSetTab = (next: Tab) => {
    setTab(next);
    setOpenCallId(null);
    setOpenCaseId(null);
  };
  const handleSetQueueView = (next: QueueView) => {
    setQueueView(next);
    setOpenCallId(null);
    setOpenCaseId(null);
  };
  const handleSetCasesView = (next: CasesView) => {
    setCasesView(next);
    setOpenCallId(null);
    setOpenCaseId(null);
  };

  const onViewJob = (caseId: string) => {
    setOpenCallId(null);
    setOpenCaseId(caseId);
    // keeps the list pane in sync with the docked detail panel on desktop,
    // where both are visible at once; on mobile only one pane is ever
    // visible, so there's nothing to desync and this is skipped to avoid
    // changing where "back" lands (today, always wherever you were)
    if (isDesktop) {
      setTab("cases");
      const kase = CASES.find((k) => k.id === caseId);
      if (kase) setCasesView(casesViewForStatus(kase.status));
    }
  };

  return (
    <div
      className={
        isDesktop
          ? "font-sans text-[#1E2233] h-screen w-full flex flex-col overflow-hidden"
          : "font-sans text-[#1E2233] h-screen max-w-md mx-auto flex flex-col overflow-hidden border-x border-[#ECEEF5]"
      }
      style={{ colorScheme: "light", backgroundColor: COLORS.page }}
    >
      {isDesktop ? (
        <DesktopShell
          tab={tab}
          setTab={handleSetTab}
          queueView={queueView}
          setQueueView={handleSetQueueView}
          casesView={casesView}
          setCasesView={handleSetCasesView}
          openCall={openCall}
          openCase={openCase}
          callState={callState}
          callDispatch={callDispatch}
          filteredCases={filteredCases}
          setOpenCallId={setOpenCallId}
          setOpenCaseId={setOpenCaseId}
          onViewJob={onViewJob}
        />
      ) : (
        <MobileShell
          tab={tab}
          setTab={handleSetTab}
          queueView={queueView}
          setQueueView={handleSetQueueView}
          casesView={casesView}
          setCasesView={handleSetCasesView}
          openCall={openCall}
          openCase={openCase}
          callState={callState}
          callDispatch={callDispatch}
          filteredCases={filteredCases}
          setOpenCallId={setOpenCallId}
          setOpenCaseId={setOpenCaseId}
          onViewJob={onViewJob}
        />
      )}
    </div>
  );
}
