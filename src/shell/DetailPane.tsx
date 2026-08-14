import type { Dispatch, ReactNode } from "react";
import { MessageSquare } from "lucide-react";
import { COLORS, ink } from "../theme/colors";
import { CallDetail } from "../features/call-detail/CallDetail";
import { CaseDetail } from "../features/cases/CaseDetail";
import type { CallAction, CallState } from "../state/callState";
import type { Call, CaseRecord } from "../types";

// stronger than CARD_SHADOW (the resting elevation used by small list/info
// cards) — this is the one big focused surface on screen, so it should read
// as clearly lifted above both the page background and the list pane's
// own map-card-styled rows (which the Team column's UnitCards echo), not
// blend in with them
const PANEL_SHADOW = `0 2px 4px ${ink(0.04)}, 0 16px 40px ${ink(0.1)}`;

// one fallback ("select something") correctly covers every "nothing open"
// case — missed/completed sub-views (which never call onOpen), or queue/jobs
// with nothing selected — without special-casing per view
function EmptyDetailState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 px-10 text-center">
      <MessageSquare size={22} style={{ color: COLORS.faint }} />
      <div className="text-[13px]" style={{ color: COLORS.faint }}>
        Select a call or job to see details here.
      </div>
    </div>
  );
}

// docked right-hand panel for the desktop split view: whichever of
// CallDetail/CaseDetail is open, in "panel" mode (docked, not full-screen),
// or the empty state — always inset in its own elevated white card so it
// reads as a distinct, focused surface rather than another row in the list.
// Deliberately doesn't impose a width cap on that card here — CallDetail's
// panel mode wants most of the available width for its three simultaneous
// Team/Call/Context columns, while CaseDetail's panel mode (a simple stack
// of info cards) wants a narrower reading column instead. Each owns that
// call internally rather than DetailPane guessing one width that would
// suit both.
export function DetailPane({
  openCall,
  openCase,
  callState,
  callDispatch,
  onCloseCall,
  onCloseCase,
  onViewJob,
  fallback,
}: {
  openCall: Call | undefined;
  openCase: CaseRecord | undefined;
  callState: CallState | null;
  callDispatch: Dispatch<CallAction>;
  onCloseCall: () => void;
  onCloseCase: () => void;
  onViewJob: (caseId: string) => void;
  // shown instead of the generic empty state when nothing's open — e.g. the
  // Scheduled jobs view uses this slot for the gantt chart overview, since a
  // wide elevated panel is a much better home for a timeline than the
  // narrow list pane it used to be squeezed into
  fallback?: ReactNode;
}) {
  return (
    <div
      className="flex-1 min-w-0 h-full min-h-0 p-4"
      style={{ backgroundColor: COLORS.page }}
    >
      {/* overflow-hidden lives only on the card itself (to clip its content
          to the rounded corners) — putting it on this outer padding wrapper
          too would also clip the card's own box-shadow at the padding edge */}
      <div
        className="h-full min-h-0 flex flex-col bg-white rounded-[28px] overflow-hidden"
        style={{ boxShadow: PANEL_SHADOW }}
      >
        {openCall && callState ? (
          <CallDetail
            call={openCall}
            state={callState}
            dispatch={callDispatch}
            variant="panel"
            onBack={onCloseCall}
            onViewJob={onViewJob}
          />
        ) : openCase ? (
          <CaseDetail kase={openCase} variant="panel" onBack={onCloseCase} />
        ) : (
          fallback ?? <EmptyDetailState />
        )}
      </div>
    </div>
  );
}
