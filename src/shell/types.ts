import type { CaseStatus } from "../types";

export type Tab = "queue" | "cases";
export type QueueView = "live" | "missed" | "completed";
export type CasesView = "active" | "scheduled" | "resolved";

// the same active/scheduled/resolved bucketing App.tsx uses to filter the
// cases list, in reverse — given a case's actual status, which Jobs sub-view
// it belongs to. Shared so the desktop shell's "keep the list pane in sync
// with the docked detail panel" logic can't drift from the filter itself.
export function casesViewForStatus(status: CaseStatus): CasesView {
  if (status === "en_route" || status === "on_scene") return "active";
  return status;
}

// the "N active" / "N missed" header count string, shared by the mobile
// header and the desktop list-pane header so the two can't drift apart
export function queueOrCasesCountLabel(args: {
  tab: Tab;
  queueView: QueueView;
  casesView: CasesView;
  callsCount: number;
  missedCount: number;
  completedCount: number;
  filteredCasesCount: number;
}): string {
  const { tab, queueView, casesView, callsCount, missedCount, completedCount, filteredCasesCount } = args;
  if (tab === "cases") return `${filteredCasesCount} ${casesView === "active" ? "in progress" : casesView}`;
  if (queueView === "live") return `${callsCount} active`;
  if (queueView === "missed") return `${missedCount} missed`;
  return `${completedCount} in history`;
}
