import { Fragment, useEffect, useRef, type Dispatch, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Mic,
  MicOff,
  MessageSquare,
  Pause,
  PhoneOff,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { COLORS, ink, urgencyDot } from "../../theme/colors";
import { frostedStyle } from "../../theme/styles";
import {
  AUTO_CONFIRM_DELAY_MS,
  CALL_CLOCK_TICK_MS,
  CALL_PHASES,
  MESSAGE_ADVANCE_DELAY_MS,
  MESSAGE_REVEAL_DELAY_MS,
  selectAssignedTech,
  selectAuthorLabel,
  selectCanConfirm,
  selectCurrentPhaseIndex,
  selectIdentifiedName,
  selectNameKnown,
  type CallAction,
  type CallDetailTab,
  type CallState,
} from "../../state/callState";
import type { Call } from "../../types";
import { Card } from "../../components/primitives/Card";
import { IconButton } from "../../components/primitives/IconButton";
import { SegmentedControl, type SegmentedControlOption } from "../../components/primitives/SegmentedControl";
import { SkeletonBar } from "../../components/primitives/SkeletonBar";
import { Squircle } from "../../components/primitives/Squircle";
import { SquircleCard } from "../../components/primitives/SquircleCard";
import { Waveform } from "../../components/primitives/Waveform";
import { ContactCard } from "../../components/ContactCard";
import { StreetMap } from "../../components/map/StreetMap";
import { UnitCard } from "./UnitCard";

// how far the pinned plan card's own footprint reaches up into the
// scrolling area above it — every scrollable region behind it (whether
// that's the single fullscreen column or each of the panel's three
// columns) reserves this much bottom padding so content never hides under it
const PLAN_CARD_CLEARANCE_PX = 240;

export function CallDetail({
  call,
  state,
  dispatch,
  variant = "fullscreen",
  onBack,
  onViewJob,
}: {
  call: Call;
  state: CallState;
  dispatch: Dispatch<CallAction>;
  variant?: "fullscreen" | "panel";
  onBack: () => void;
  onViewJob?: (caseId: string) => void;
}) {
  const isPanel = variant === "panel";
  // fullscreen sits directly on the page background; the panel variant sits
  // inside DetailPane's white elevated card instead — every edge-fade needs
  // to fade to whichever of those it's actually over, or it shows a seam
  const surfaceRgb = isPanel ? "255,255,255" : "246,247,251";
  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // dialog behavior for the technician picker: Escape closes it, opening
  // moves focus into it, closing returns focus to whatever opened it
  useEffect(() => {
    if (!state.showPicker) return;
    pickerRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "CLOSE_PICKER" });
    };
    document.addEventListener("keydown", onKeyDown);
    const trigger = pickerTriggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [state.showPicker, dispatch]);

  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "TICK_CLOCK" }), CALL_CLOCK_TICK_MS);
    return () => clearInterval(t);
  }, [dispatch]);

  // each newly-visible message "speaks" for a moment (waveform) before its
  // text resolves — including the first message, on mount
  useEffect(() => {
    if (state.visibleMsgCount === 0) return;
    const idx = state.visibleMsgCount - 1;
    const t = setTimeout(() => dispatch({ type: "REVEAL_MESSAGE", idx }), MESSAGE_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.visibleMsgCount, dispatch]);

  // advance to the next script line once the current one has had time to land
  useEffect(() => {
    if (state.visibleMsgCount >= call.script.length) return;
    const t = setTimeout(() => dispatch({ type: "ADVANCE_MESSAGE" }), MESSAGE_ADVANCE_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.visibleMsgCount, dispatch]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.visibleMsgCount]);

  const mm = String(Math.floor(state.seconds / 60)).padStart(2, "0");
  const ss = String(state.seconds % 60).padStart(2, "0");
  const top = selectAssignedTech(state);
  const currentPhaseIdx = selectCurrentPhaseIndex(state, call);
  const canConfirm = selectCanConfirm(state, call);
  const identifiedName = selectIdentifiedName(call);
  const nameKnown = selectNameKnown(state, call);

  // AI dispatch mode always schedules on its own once there's something real
  // to confirm — same pattern as auto-run in agentic coding tools. Manual
  // takeover never auto-confirms; a human has to tap it.
  useEffect(() => {
    if (state.mode !== "ai" || !canConfirm || state.confirmed) return;
    const t = setTimeout(() => dispatch({ type: "CONFIRM" }), AUTO_CONFIRM_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.mode, canConfirm, state.confirmed, dispatch]);

  const tabs: SegmentedControlOption<CallDetailTab>[] = [
    { key: "units", label: "Team", icon: Users },
    { key: "call", label: "Call", icon: MessageSquare },
    { key: "context", label: "Context", icon: FileText },
  ];

  // the three sections' content, shared between the fullscreen tab switcher
  // (one visible at a time) and the desktop panel's three simultaneous
  // columns — built once so neither layout duplicates the markup
  const teamContent = (
    <div className="flex flex-col gap-2.5">
      {state.ranked.map((u) => (
        <UnitCard key={u.id} u={u} centerLatLng={call.latlng} />
      ))}
    </div>
  );

  const transcriptContent = (
    <div ref={scrollRef} className="flex flex-col gap-2.5" aria-live="polite" aria-relevant="additions">
      {call.script.slice(0, state.visibleMsgCount).map((m, i) => {
        const isCaller = m.who === "caller";
        const authorLabel = selectAuthorLabel(state, call, i);
        return (
          <div key={i} className={`flex flex-col gap-1 max-w-[80%] ${isCaller ? "self-end items-end" : "self-start items-start"}`}>
            <Squircle
              as="div"
              radius={isCaller ? [20, 20, 6, 20] : [20, 20, 20, 6]}
              className="px-4 py-2.5 text-sm leading-snug transition-all duration-300"
              style={
                isCaller
                  ? { backgroundColor: COLORS.accent, color: "#FFFFFF" }
                  : { backgroundColor: COLORS.surface, color: COLORS.ink }
              }
            >
              {state.revealedMsgIdxs.has(i) ? m.text : <Waveform color={isCaller ? "#FFFFFF" : COLORS.accent} />}
            </Squircle>
            <span className="text-[10px] text-[#9AA0B0] px-1">{authorLabel}</span>
          </div>
        );
      })}
    </div>
  );

  const contextContent = (
    <div className="flex flex-col gap-2">
      <SquircleCard as="div" radius={18} className="relative h-28 overflow-hidden">
        <StreetMap ranked={state.ranked} height="100%" />
      </SquircleCard>
      {call.contact && <ContactCard contact={call.contact} />}
      {call.contextItems && call.contextItems.length > 0 ? (
        call.contextItems.map((a, i) => (
          <Card key={i}>
            <div className="text-[13px] font-semibold mb-0.5">{a.label}</div>
            <div className="text-[12px] text-[#6B7280] leading-snug">{a.detail}</div>
          </Card>
        ))
      ) : (
        <div className="text-[13px] text-[#9AA0B0] text-center px-6 py-6">
          Nothing else surfaced yet — relevant history or documents will appear here as the call develops.
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative h-full flex flex-col ${isPanel ? "w-full max-w-[1200px] mx-auto" : ""}`}>
      {/* top strip */}
      <div className="relative z-10 px-4 py-2.5 flex items-center gap-2.5 shrink-0" style={frostedStyle("down", surfaceRgb)}>
        <button
          onClick={onBack}
          aria-label={isPanel ? "Close" : "Back"}
          className="w-9 h-9 rounded-full bg-[#F1F2F8] flex items-center justify-center shrink-0"
        >
          {isPanel ? <X size={16} className="text-[#454B5C]" /> : <ChevronLeft size={16} className="text-[#454B5C]" />}
        </button>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight truncate">{call.situation}</div>
          <div className="text-[11px] text-[#6B7280] leading-tight tabular-nums">
            {mm}:{ss} · {call.location}
          </div>
        </div>
      </div>

      {/* tab switcher — only meaningful when one section shows at a time;
          the desktop panel shows Team/Call/Context simultaneously instead */}
      {!isPanel && (
        <div className="px-4 pt-3 pb-2 shrink-0">
          <SegmentedControl
            variant="track"
            options={tabs}
            value={state.tab}
            onChange={(tab) => dispatch({ type: "SET_TAB", tab })}
            ariaLabel="Call detail sections"
          />
        </div>
      )}

      {/* surfaced context card */}
      {call.banner && !state.contextDismissed && (
        <div className="mx-4 mt-3 mb-3 shrink-0">
          <SquircleCard as="div" radius={18} className="bg-[#FFE8E8] p-3 flex items-start gap-2.5" borderColor="#F5C6C4">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: COLORS.danger }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold" style={{ color: "#8A2E28" }}>
                {call.banner.title}
              </div>
              <div className="text-[12px] mt-0.5 leading-snug" style={{ color: "#7A2A25" }}>
                {call.banner.body}
              </div>
              {/* the context section is always visible in the panel layout,
                  so there's nowhere to jump to */}
              {!isPanel && (
                <button
                  onClick={() => dispatch({ type: "SET_TAB", tab: "context" })}
                  className="text-[11px] font-semibold text-[#3B5BDB] mt-1.5"
                >
                  View details →
                </button>
              )}
            </div>
            <button
              onClick={() => dispatch({ type: "DISMISS_BANNER" })}
              aria-label="Dismiss alert"
              className="shrink-0"
              style={{ color: COLORS.danger }}
            >
              <X size={15} />
            </button>
          </SquircleCard>
        </div>
      )}

      {/* scrollable content + floating plan card — content scrolls in its own
          absolute layer so it can pass fully behind the pinned card instead
          of being squeezed by ordinary flex sizing */}
      <div className="relative flex-1 min-h-0">
        {isPanel ? (
          <div className="absolute inset-0 flex">
            <PanelColumn width={260} icon={Users} label="Team" borderSide="right">
              {teamContent}
            </PanelColumn>
            <PanelColumn icon={MessageSquare} label="Call">
              {transcriptContent}
            </PanelColumn>
            <PanelColumn width={300} icon={FileText} label="Context" borderSide="left">
              {contextContent}
            </PanelColumn>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-y-auto px-4 pt-1" style={{ paddingBottom: PLAN_CARD_CLEARANCE_PX }}>
            {state.tab === "units" && teamContent}
            {state.tab === "call" && transcriptContent}
            {state.tab === "context" && contextContent}
          </div>
        )}

        {/* fade where scrolling content passes behind the card — gives the
            pinned card a little visual separation instead of a hard edge */}
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{ height: 210, background: `linear-gradient(to bottom, rgba(${surfaceRgb},0) 0%, rgb(${surfaceRgb}) 75%)` }}
        />

        {/* pinned plan card — floats above the bottom edge with real elevation */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pt-1 pb-7 z-10">
          <SquircleCard
            as="div"
            radius={20}
            className="bg-white pt-3.5 px-5 pb-8 flex flex-col gap-2.5"
            shadow={`0 6px 20px ${ink(0.1)}, 0 1px 4px ${ink(0.06)}`}
          >
            {/* mini phase stepper */}
            <div className="flex items-start px-1">
              {CALL_PHASES.map((p, i) => {
                const done = i < currentPhaseIdx || (i === currentPhaseIdx && p.key === "scheduled");
                const active = i === currentPhaseIdx && p.key !== "scheduled";
                const isFirst = i === 0;
                const isLast = i === CALL_PHASES.length - 1;
                return (
                  <Fragment key={p.key}>
                    <div
                      className={`flex flex-col gap-1 ${isFirst ? "items-start" : isLast ? "items-end" : "items-center"}`}
                      style={{ width: 0 }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: done || active ? COLORS.accent : COLORS.trackInactive,
                          transition: "background-color 0.3s",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {done && <Check size={10} className="text-white" strokeWidth={3} />}
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </div>
                      <span
                        className="text-[9px] font-medium whitespace-nowrap"
                        style={{ color: done || active ? COLORS.accent : COLORS.faint }}
                      >
                        {p.label}
                      </span>
                    </div>
                    {i < CALL_PHASES.length - 1 && (
                      // same height as the circle (16px), so centering the 2px
                      // bar inside it lines up exactly with the circle's center
                      // — no margin guesswork
                      <div className="flex-1 h-4 flex items-center mx-1">
                        <div
                          className="w-full h-[2px] rounded-full"
                          style={{
                            backgroundColor: i < currentPhaseIdx ? COLORS.accent : COLORS.trackInactive,
                            transition: "background-color 0.3s",
                          }}
                        />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

            {/* contact-card style hierarchy, standardized to four fixed rows —
                each one shows a skeleton until its info resolves, rather than
                the card growing/shrinking as the call progresses */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 h-[15px]">
                {nameKnown ? (
                  <span className="text-[15px] font-bold text-[#1E2233] leading-tight truncate">
                    {identifiedName || "Caller"}
                  </span>
                ) : (
                  <SkeletonBar width={128} height={13} />
                )}
              </div>

              <div className="h-[12px] flex items-center gap-1.5">
                {currentPhaseIdx >= 0 ? (
                  <>
                    <span className="w-4 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: urgencyDot[call.urgency] }} />
                    </span>
                    <div className="text-[12px] text-[#6B7280] leading-snug truncate">
                      {call.situation} · {call.location}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-4 shrink-0" />
                    <SkeletonBar width={168} height={10} />
                  </>
                )}
              </div>

              <div className="h-[13px]">
                {currentPhaseIdx >= 2 ? (
                  <button
                    ref={pickerTriggerRef}
                    onClick={() => !state.confirmed && dispatch({ type: "OPEN_PICKER" })}
                    disabled={state.confirmed}
                    aria-haspopup="dialog"
                    aria-label={`Assigned: ${top.id}, ${
                      call.mode === "schedule" ? top.scheduledTime : `${top.eta} minutes away`
                    }. Tap to choose a different technician.`}
                    className="flex items-center gap-1.5 -ml-1 pl-1 pr-2 rounded-[6px] transition-all active:scale-[0.98] disabled:active:scale-100"
                    style={{ backgroundColor: state.confirmed ? "transparent" : "rgba(59,91,219,0.06)" }}
                  >
                    <span className="w-4 flex items-center justify-center shrink-0">
                      <Clock size={11} style={{ color: COLORS.accent }} />
                    </span>
                    <span className="text-[12px] font-semibold truncate" style={{ color: COLORS.accent }}>
                      {top.id}
                    </span>
                    <span className="text-[11px] text-[#9AA0B0] shrink-0">
                      {call.mode === "schedule" ? top.scheduledTime : `${top.eta} min away`}
                    </span>
                    {!state.confirmed && <ChevronRight size={11} className="text-[#9AA0B0] shrink-0" />}
                  </button>
                ) : (
                  <div className="h-full flex items-center gap-1.5">
                    <span className="w-4 shrink-0" />
                    <SkeletonBar width={150} height={10} />
                  </div>
                )}
              </div>
            </div>

            {state.mode === "manual" ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <IconButton
                    size="sm"
                    icon={state.muted ? MicOff : Mic}
                    active={state.muted}
                    onClick={() => dispatch({ type: "TOGGLE_MUTE" })}
                    label="Mute"
                  />
                  <IconButton size="sm" icon={Pause} onClick={() => {}} label="Hold" />
                  <IconButton size="sm" icon={ArrowRightLeft} onClick={() => {}} label="Transfer" />
                  <IconButton size="sm" icon={PhoneOff} danger onClick={onBack} label="End call" />
                </div>
                {state.confirmed ? (
                  <button
                    onClick={() => onViewJob && onViewJob(call.resultCaseId)}
                    role="status"
                    aria-live="polite"
                    className="w-full h-9 rounded-full font-semibold text-[12px] active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    style={{ backgroundColor: COLORS.successBg, color: COLORS.success }}
                  >
                    View job
                    <ChevronRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => canConfirm && dispatch({ type: "CONFIRM" })}
                    disabled={!canConfirm}
                    className="w-full h-9 rounded-full font-semibold text-[12px] active:scale-[0.98] transition-all disabled:opacity-40"
                    style={{ backgroundColor: COLORS.accent, color: "#FFFFFF" }}
                  >
                    {call.mode === "schedule" ? "Confirm appointment" : "Confirm"}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => state.confirmed && onViewJob && onViewJob(call.resultCaseId)}
                disabled={!state.confirmed}
                role="status"
                aria-live="polite"
                className="w-full h-9 rounded-full font-semibold text-[12px] transition-all flex items-center justify-center gap-1.5"
                style={
                  state.confirmed
                    ? { backgroundColor: COLORS.successBg, color: COLORS.success }
                    : { backgroundColor: ink(0.06), color: COLORS.subtle }
                }
              >
                {state.confirmed ? (
                  <>
                    {call.mode === "schedule" ? "Scheduled" : "Dispatched"} — View job
                    <ChevronRight size={13} />
                  </>
                ) : (
                  <>
                    {canConfirm && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {canConfirm
                      ? "Confirming…"
                      : currentPhaseIdx >= 1
                      ? "Confirming customer details…"
                      : "Understanding the issue…"}
                  </>
                )}
              </button>
            )}
          </SquircleCard>

          {/* toggle floats on the card's bottom-left edge — reinforces that
              it's the thing controlling everything inside */}
          <div className="absolute z-10" style={{ left: 20, bottom: 28, transform: "translate(0, 50%)" }}>
            <SegmentedControl
              variant="solid"
              stretch={false}
              disabled={state.confirmed}
              value={state.mode}
              onChange={(mode) => dispatch({ type: "SET_MODE", mode })}
              ariaLabel="Call handling mode"
              options={[
                { key: "ai", label: "AI Dispatch" },
                { key: "manual", label: "Manual takeover" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* tech/time override picker — tapping the assignment row opens this
          instead of a separate Revise flow; picking an option re-ranks it
          to the top, which is what the plan card reflects */}
      {state.showPicker && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => dispatch({ type: "CLOSE_PICKER" })}>
          <div className="absolute inset-0 bg-black/30" />
          <SquircleCard
            as="div"
            radius={14}
            className="relative w-full bg-white p-4 flex flex-col gap-2"
            shadow={`0 -8px 24px ${ink(0.12)}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="picker-title"
          >
            <div id="picker-title" ref={pickerRef} tabIndex={-1} className="text-[13px] font-semibold text-[#1E2233] mb-1">
              Choose technician
            </div>
            {state.ranked.map((u) => (
              <button
                key={u.id}
                onClick={() => dispatch({ type: "SELECT_TECH", tech: u })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left transition-all active:scale-[0.98]"
                style={{ backgroundColor: u.id === top.id ? "rgba(59,91,219,0.08)" : "transparent" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#1E2233] truncate">{u.id}</div>
                  <div className="text-[11px] text-[#9AA0B0] truncate">{u.tag}</div>
                </div>
                <div className="text-[12px] font-medium text-[#3B5BDB] shrink-0 whitespace-nowrap">
                  {u.eta != null ? `${u.eta} min` : u.scheduledTime}
                </div>
              </button>
            ))}
          </SquircleCard>
        </div>
      )}
    </div>
  );
}

// one column of the desktop panel's simultaneous Team/Call/Context layout —
// its own label, its own scroll region, its own bottom clearance for the
// pinned plan card that overlays all three columns at once
function PanelColumn({
  width,
  icon: Icon,
  label,
  borderSide,
  children,
}: {
  width?: number;
  icon: LucideIcon;
  label: string;
  borderSide?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div
      className={`h-full min-h-0 overflow-y-auto ${width ? "shrink-0" : "flex-1 min-w-0"} ${
        borderSide === "left" ? "border-l" : borderSide === "right" ? "border-r" : ""
      } border-[#ECEEF5]`}
      style={width ? { width } : undefined}
    >
      <div className="px-4 pt-4 pb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
        <Icon size={12} />
        {label}
      </div>
      <div className="px-4" style={{ paddingBottom: PLAN_CARD_CLEARANCE_PX }}>
        {children}
      </div>
    </div>
  );
}
