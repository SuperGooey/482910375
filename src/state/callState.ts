import { displayName } from "../lib/contact";
import type { Call, CallUnit } from "../types";

export type CallHandlingMode = "ai" | "manual";
export type CallDetailTab = "units" | "call" | "context";
export type CallPhaseKey = "triage" | "customer" | "scheduling" | "scheduled";

export interface CallPhase {
  key: CallPhaseKey;
  label: string;
}

// the four stages a call moves through, driving the mini progress tracker in
// the pinned plan bar. "scheduled" is only reached once the plan is confirmed
export const CALL_PHASES: CallPhase[] = [
  { key: "triage", label: "Triage" },
  { key: "customer", label: "Customer" },
  { key: "scheduling", label: "Scheduling" },
  { key: "scheduled", label: "Scheduled" },
];

// ---- call state machine ----
// everything about how a live call behaves over time — timing, phase
// progression, confirmation rules — lives here, independent of how
// CallDetail renders it. The reducer only describes what a given action
// changes; the selectors below derive everything else (phase, whether
// confirming is allowed, who's speaking) from that state. None of this
// touches React or the DOM, so it's easy to read, and to change without
// having to trace through JSX to find where a rule actually lives.

// timing constants driving the simulated live-call experience
export const CALL_CLOCK_TICK_MS = 1000; // elapsed-time counter granularity
export const MESSAGE_REVEAL_DELAY_MS = 750; // waveform-to-text delay per message
export const MESSAGE_ADVANCE_DELAY_MS = 2200; // gap before the next message appears
export const AUTO_CONFIRM_DELAY_MS = 700; // AI-mode pause before auto-confirming, once eligible

// earliest phase at which a plan can be confirmed (by a human or the AI) —
// expressed as a phase key rather than a hardcoded index, so it stays
// correct even if CALL_PHASES is reordered or extended
const MIN_PHASE_FOR_CONFIRM: CallPhaseKey = "scheduling";

export interface CallState {
  mode: CallHandlingMode; // "ai" (AI dispatch, auto-confirms) | "manual" (human takeover, confirms manually)
  confirmed: boolean;
  muted: boolean;
  tab: CallDetailTab;
  showPicker: boolean;
  contextDismissed: boolean;
  ranked: CallUnit[]; // technician candidates, ranked; ranked[0] is the assigned tech
  visibleMsgCount: number; // how many script lines have appeared so far
  revealedMsgIdxs: Set<number>; // which appeared lines have finished "speaking" and now show text
  seconds: number;
}

export type CallAction =
  | { type: "TICK_CLOCK" }
  | { type: "ADVANCE_MESSAGE" }
  | { type: "REVEAL_MESSAGE"; idx: number }
  | { type: "SET_MODE"; mode: CallHandlingMode }
  | { type: "CONFIRM" }
  | { type: "TOGGLE_MUTE" }
  | { type: "SELECT_TECH"; tech: CallUnit }
  | { type: "OPEN_PICKER" }
  | { type: "CLOSE_PICKER" }
  | { type: "SET_TAB"; tab: CallDetailTab }
  | { type: "DISMISS_BANNER" };

export function initCallState(call: Call): CallState {
  return {
    mode: "ai",
    confirmed: false,
    muted: false,
    tab: "call",
    showPicker: false,
    contextDismissed: false,
    ranked: call.units,
    visibleMsgCount: 1,
    revealedMsgIdxs: new Set(),
    seconds: call.startSeconds,
  };
}

export function callReducer(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case "TICK_CLOCK":
      return { ...state, seconds: state.seconds + 1 };
    case "ADVANCE_MESSAGE":
      return { ...state, visibleMsgCount: state.visibleMsgCount + 1 };
    case "REVEAL_MESSAGE":
      return { ...state, revealedMsgIdxs: new Set(state.revealedMsgIdxs).add(action.idx) };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "CONFIRM":
      return { ...state, confirmed: true };
    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };
    case "SELECT_TECH":
      // choosing a technician re-ranks them to the top and closes the picker
      // in one step — those two things always happen together
      return {
        ...state,
        ranked: [action.tech, ...state.ranked.filter((u) => u.id !== action.tech.id)],
        showPicker: false,
      };
    case "OPEN_PICKER":
      return { ...state, showPicker: true };
    case "CLOSE_PICKER":
      return { ...state, showPicker: false };
    case "SET_TAB":
      return { ...state, tab: action.tab };
    case "DISMISS_BANNER":
      return { ...state, contextDismissed: true };
    default:
      return state;
  }
}

// the call moves through these phases as the transcript plays out; each
// script line is tagged with the phase it belongs to. Once confirmed, the
// call is in the terminal "scheduled" phase regardless of the transcript.
export function selectCurrentPhaseKey(state: CallState, call: Call): CallPhaseKey {
  if (state.confirmed) return "scheduled";
  const revealedIdxs = [...state.revealedMsgIdxs];
  const lastRevealedIdx = revealedIdxs.length ? Math.max(...revealedIdxs) : -1;
  return lastRevealedIdx >= 0 ? call.script[lastRevealedIdx].phase || "triage" : "triage";
}

export function selectCurrentPhaseIndex(state: CallState, call: Call): number {
  return CALL_PHASES.findIndex((p) => p.key === selectCurrentPhaseKey(state, call));
}

export function selectCanConfirm(state: CallState, call: Call): boolean {
  const minIdx = CALL_PHASES.findIndex((p) => p.key === MIN_PHASE_FOR_CONFIRM);
  return selectCurrentPhaseIndex(state, call) >= minIdx;
}

// the caller's name can come from a confident CRM/phone match, or simply
// from them stating it during the customer phase — those are two different
// sources and a call can have either, both, or neither
export function selectIdentifiedName(call: Call): string | null {
  return displayName(call.contact) || call.confirmedName || null;
}

export function selectAssignedTech(state: CallState): CallUnit {
  return state.ranked[0];
}

// earliest phase at which the caller's identity is considered "known" in
// the conversation — mirrors MIN_PHASE_FOR_CONFIRM's pattern, comparing by
// phase key rather than a hardcoded index
const MIN_PHASE_FOR_NAME_REVEAL: CallPhaseKey = "customer";

// the AI's question and the caller's reply share the same phase tag (both
// "customer"), so checking "has the customer phase started" fires as soon
// as the AI *asks* — before the caller has actually said anything. What we
// want is specifically whether the caller has replied within or after that
// phase, which is the real moment their identity becomes known.
export function selectNameKnown(state: CallState, call: Call): boolean {
  const minIdx = CALL_PHASES.findIndex((p) => p.key === MIN_PHASE_FOR_NAME_REVEAL);
  return call.script.some(
    (m, i) =>
      state.revealedMsgIdxs.has(i) &&
      m.who === "caller" &&
      CALL_PHASES.findIndex((p) => p.key === (m.phase || "triage")) >= minIdx
  );
}

export function selectAuthorLabel(state: CallState, call: Call, msgIndex: number): string {
  const m = call.script[msgIndex];
  if (m.who !== "caller") return "AI dispatcher";
  return (selectNameKnown(state, call) && selectIdentifiedName(call)) || "Caller";
}
