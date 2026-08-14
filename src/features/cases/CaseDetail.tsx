import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronLeft, DollarSign, FileText, History, Phone, StickyNote, Wrench, X } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { hashSeed } from "../../lib/geo";
import { displayName } from "../../lib/contact";
import { initials } from "../../lib/schedule";
import { MiniMap } from "../../components/map/MiniMap";
import { Card } from "../../components/primitives/Card";
import { Pill } from "../../components/primitives/Pill";
import { ContactCard } from "../../components/ContactCard";
import { PROPERTY_HISTORY } from "../../data/propertyHistory";
import { EQUIPMENT_INFO } from "../../data/equipmentInfo";
import { PREMISE_NOTES } from "../../data/premiseNotes";
import { findOriginatingCall } from "../../data/mockData";
import type { Call, CaseRecord, ServiceHistoryEntry, WarrantyStatus } from "../../types";
import { caseMapMode, statusStyle } from "./shared";

export function CaseDetail({
  kase,
  variant = "fullscreen",
  onBack,
}: {
  kase: CaseRecord;
  variant?: "fullscreen" | "panel";
  onBack: () => void;
}) {
  const isPanel = variant === "panel";
  // fullscreen sits directly on the page background; the panel variant sits
  // inside DetailPane's white elevated card instead — the hero fade needs to
  // fade to whichever of those it's actually over, or it shows a seam
  const surfaceRgb = isPanel ? "255,255,255" : "246,247,251";
  const s = statusStyle[kase.status];
  const dim = kase.status === "resolved";
  // gates the hero's bottom-left customer overlay (panel mode only) — same
  // "are we confident enough to show a name" threshold used everywhere else
  // a contact match surfaces a name instead of a fallback/placeholder
  const contactName = displayName(kase.contact);
  // The call that produced this case, if any — most cases (walk-ins,
  // scheduled follow-ups) have none, so panel mode's call-summary section
  // below is conditional on this being defined rather than always rendered.
  const originatingCall = findOriginatingCall(kase.id);
  // Precomputed once so the exact same markup can be placed differently by
  // the two layouts below (fullscreen's flat stack vs. panel's left
  // column + right rail) without duplicating each card's contents.
  const contextCard = kase.contextItems && (
    <Card key="context">
      <div className="flex items-center gap-1.5 mb-2 text-[#6B7280]">
        <FileText size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Context</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {kase.contextItems.map((a, i) => (
          <div key={i}>
            <div className="text-[13px] font-semibold">{a.label}</div>
            <div className="text-[12px] text-[#6B7280] leading-snug">{a.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
  const outcomeCard = (
    <Card key="outcome">
      <div className="flex items-center gap-1.5 mb-1 text-[#6B7280]">
        <FileText size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Outcome</span>
      </div>
      <div className="text-sm text-[#1E2233]">{kase.note}</div>
    </Card>
  );
  const costCard = (
    <Card key="cost">
      <div className="flex items-center gap-1.5 mb-1 text-[#6B7280]">
        <DollarSign size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Cost</span>
      </div>
      <div className="text-sm text-[#1E2233]">${kase.cost}</div>
    </Card>
  );
  const followUpCard = (
    <Card key="followup">
      <div className="flex items-center gap-1.5 mb-2 text-[#6B7280]">
        <CheckCircle2 size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Follow-up</span>
      </div>
      {kase.followUp ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-[#1E2233]">{kase.followUpNote}</span>
          <button
            className="shrink-0 h-9 px-3 rounded-full text-[12px] font-semibold active:scale-95 transition-all"
            style={{ backgroundColor: COLORS.accent, color: "#FFFFFF" }}
          >
            Mark done
          </button>
        </div>
      ) : (
        <div className="text-sm text-[#6B7280]">Nothing outstanding.</div>
      )}
    </Card>
  );
  return (
    // panel mode gets the same ultra-wide backstop cap as CallDetail's panel
    // mode, and reflows the info cards into a 2-column grid instead of a
    // single stack — otherwise this much width just leaves the cards
    // looking sparse against a mostly-empty card
    <div className={`h-full flex flex-col ${isPanel ? "w-full max-w-[1200px] mx-auto" : ""}`}>
      {/* hero: map extends up behind the header and fades into the
          surrounding background before the content starts, instead of two
          stacked blocks. Panel mode (desktop) gets a bit more height and
          overlays Status (top-right) and the customer's name/avatar
          (bottom-left) directly on the map, mirroring the pill-on-map-card
          pattern used throughout Queue/Cases lists (see MapCard) instead of
          burying that info in cards below the fold. */}
      <div className="relative shrink-0" style={{ height: isPanel ? 260 : 200 }}>
        <MiniMap seed={hashSeed(kase.id)} distancePct={22} mode={caseMapMode[kase.status]} dim={dim} latlng={kase.latlng} />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(${surfaceRgb},0) 0%, rgba(${surfaceRgb},0) 72%, rgb(${surfaceRgb}) 100%)`,
          }}
        />
        {/* pure blur gradient, single layer masked to fade — a continuous mask
            is smoother in principle than any number of discrete bands */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 136,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            maskImage: "linear-gradient(to bottom, black 0%, black 30%, transparent 100%)",
            WebkitMaskImage: "-webkit-linear-gradient(top, black 0%, black 30%, transparent 100%)",
          }}
        />
        <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label={isPanel ? "Close" : "Back"}
            className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center"
          >
            {isPanel ? (
              <X size={16} className="text-[#454B5C]" />
            ) : (
              <ChevronLeft size={16} className="text-[#454B5C]" />
            )}
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-[#1E2233]">{kase.unit}</div>
            <div className="text-xs text-[#454B5C]">{kase.location}</div>
          </div>
        </div>
        {/* Status, repositioned off the card grid and onto the map corner —
            same overlay slot QueueScreen's MapCard uses for its "when" pill,
            same colored look the Status card used to have. Sized up from the
            original Card's plain-Pill treatment so it reads at hero weight,
            not list-row weight. */}
        {isPanel && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            <Pill size={13} weight={600} style={{ background: s.bg, color: s.fg }}>
              {s.label}
            </Pill>
            {kase.meta && <span className="text-[13px] font-semibold text-[#454B5C]">{kase.meta}</span>}
          </div>
        )}
        {/* customer name + avatar, bottom-left over the map — only when we
            actually have a confident match; no placeholder for an
            unconfirmed/missing contact. Sized up to hero weight (bigger
            avatar + name) and lifted well clear of the content area's -mt-8
            pull-up below (see the grid container) — at the old bottom-3/
            text-sm sizing the name text visually collided with the Context
            card's top edge. Sits above the hero's fade-to-surface band (see
            the gradient div above), which is why dark text reads fine here
            despite being "on the map" — same reasoning MapCard's bottom-left
            overlays rely on. Solid accent-colored initials circle with a
            white ring (not ContactCard's light-tinted avatar) for contrast
            against varied map tile colors, matching ScheduledAgendaList's
            avatar + the white-ringed marker style in StreetMap. */}
        {isPanel && contactName && (
          <div className="absolute bottom-10 left-4 right-4 flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0 border-2 border-white shadow-md"
              style={{ backgroundColor: COLORS.accent }}
            >
              {initials(contactName)}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold truncate text-[#1E2233]">{contactName}</div>
              {kase.contact?.matchSource && (
                <div className="text-[13px] text-[#454B5C] truncate">{kase.contact.matchSource}</div>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        className={`flex-1 overflow-y-auto p-4 -mt-8 ${isPanel ? "grid items-start gap-4" : "flex flex-col gap-3"}`}
        style={isPanel ? { gridTemplateColumns: "minmax(0,1fr) 380px" } : undefined}
      >
        {/* panel mode shows Status in the hero corner instead (see above) —
            fullscreen has no hero overlays, so it keeps the Status card */}
        {!isPanel && (
          <Card>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">Status</span>
              <Pill style={{ background: s.bg, color: s.fg }}>{s.label}</Pill>
            </div>
            {kase.meta && <div className="text-sm text-[#454B5C] mt-1">{kase.meta}</div>}
          </Card>
        )}
        {/* panel mode already shows name + match confidence + source in the
            hero's bottom-left overlay (see contactName above) — this card
            would just repeat it, so it's fullscreen-only too */}
        {!isPanel && kase.contact && <ContactCard contact={kase.contact} />}
        {isPanel ? (
          <>
            {/* left/main column: the current job's own facts (Context), the
                pre-visit briefing (originating call, equipment on file,
                premise notes — everything a dispatcher wants glanceable
                before the visit), and for resolved cases Outcome/Cost/
                Follow-up — kept distinct from the property's past-visit
                history in the right rail, since these describe *this*
                dispatch, not prior ones. */}
            <div className="flex flex-col gap-4 min-w-0">
              {contextCard}
              {originatingCall && <CallSummaryCard call={originatingCall} />}
              <EquipmentCard propertyId={kase.propertyId} />
              <NotesCard propertyId={kase.propertyId} />
              {kase.status === "resolved" && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 items-start gap-3">
                    {outcomeCard}
                    {costCard}
                  </div>
                  {followUpCard}
                </div>
              )}
            </div>
            {/* right rail: a distinct, tall sidebar for the property's
                service history — not another card competing for the same
                grid cells as Context/Outcome/Cost/Follow-up above. */}
            <ServiceHistoryPanel propertyId={kase.propertyId} />
          </>
        ) : (
          <>
            {contextCard}
            {kase.status === "resolved" && (
              <>
                {outcomeCard}
                {costCard}
                {followUpCard}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Right-rail panel (panel/desktop mode only) showing the full-property
// service history — every visit on record at this address, regardless of
// which case brought the customer in this time. Distinct from the Context
// card, which is scoped to the current dispatch.
function ServiceHistoryPanel({ propertyId }: { propertyId: string }) {
  const entries = PROPERTY_HISTORY[propertyId];
  const hasHistory = entries != null && entries.length > 0;
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-3 text-[#6B7280]">
        <History size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Service history</span>
      </div>
      {hasHistory ? (
        <div className="flex flex-col">
          {[...entries].reverse().map((entry, i, arr) => (
            <ServiceHistoryRow key={entry.id} entry={entry} isLast={i === arr.length - 1} />
          ))}
        </div>
      ) : (
        <div className="text-[13px] leading-snug" style={{ color: COLORS.faint }}>
          No prior service history — this is a new customer.
        </div>
      )}
    </Card>
  );
}

function ServiceHistoryRow({ entry, isLast }: { entry: ServiceHistoryEntry; isLast: boolean }) {
  const dateLabel = new Date(`${entry.date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return (
    <div className="flex gap-3">
      {/* connector line + dot: the dot sits inline with the date, and the
          line (a plain 1px div stretched to the row's full height via the
          parent's default flex "stretch") continues down through this
          entry's bottom padding to meet the next dot — a classic timeline
          look without needing absolute positioning. */}
      <div className="flex flex-col items-center shrink-0 w-2">
        <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: COLORS.accent }} />
        {!isLast && <div className="w-px flex-1 mt-1" style={{ backgroundColor: COLORS.border }} />}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold" style={{ color: COLORS.muted }}>
            {dateLabel}
          </span>
          <span className="text-[12px] font-semibold text-[#1E2233]">${entry.cost}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ backgroundColor: COLORS.accent }}
          >
            {initials(entry.techUnit)}
          </div>
          <span className="text-[12px] font-medium text-[#1E2233] truncate">
            {entry.techUnit.replace("Tech · ", "")}
          </span>
        </div>
        <div className="text-[12px] text-[#6B7280] leading-snug mt-1">{entry.summary}</div>
      </div>
    </div>
  );
}

// Summary of the call that produced this case (panel/desktop mode only),
// with the full transcript tucked behind an accordion — this is a *review*
// of a past call, not the live in-progress view CallDetail renders, so the
// transcript gets a calmer, compact speaker-label-and-text treatment rather
// than CallDetail's colored chat bubbles. Only rendered by the caller when
// findOriginatingCall(kase.id) actually finds one — most cases don't.
function CallSummaryCard({ call }: { call: Call }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-2 text-[#6B7280]">
        <Phone size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Originating call</span>
      </div>
      <div className="text-sm text-[#1E2233]">{call.situation}</div>
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1 mt-2.5 text-[12px] font-semibold active:scale-95 transition-all"
        style={{ color: COLORS.accent }}
      >
        {expanded ? "Hide transcript" : "View transcript"}
        <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="flex flex-col gap-2.5 mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
          {call.script.map((line, i) => (
            <div key={i} className="flex items-baseline gap-2.5">
              <span
                className="shrink-0 w-11 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: line.who === "caller" ? COLORS.accent : COLORS.muted }}
              >
                {line.who === "caller" ? "Caller" : "AI"}
              </span>
              <span className="text-[12px] text-[#1E2233] leading-snug">{line.text}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Warranty status -> Pill color, same statusStyle-driven-Pill pattern used
// for CaseStatus elsewhere in this file — active reads as a success-toned
// pill, expired as a muted warning tone, unknown as a neutral one.
const warrantyPillStyle: Record<WarrantyStatus, { bg: string; fg: string; label: string }> = {
  active: { bg: COLORS.successBg, fg: COLORS.success, label: "Warranty active" },
  expired: { bg: COLORS.warningBg, fg: COLORS.warning, label: "Warranty expired" },
  unknown: { bg: COLORS.surface, fg: COLORS.muted, label: "Warranty unknown" },
};

// Structured make/model/warranty info on file for the property (panel mode
// only) — the pre-visit briefing's "what's already installed" complement to
// the property's ServiceHistoryPanel timeline. Omitted entirely when this
// property has no EQUIPMENT_INFO entry (most don't).
function EquipmentCard({ propertyId }: { propertyId: string }) {
  const items = EQUIPMENT_INFO[propertyId];
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-3 text-[#6B7280]">
        <Wrench size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Equipment on file</span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((eq, i) => {
          const w = warrantyPillStyle[eq.warrantyStatus];
          return (
            <div
              key={eq.id}
              className={i === 0 ? "" : "pt-3 border-t"}
              style={i === 0 ? undefined : { borderColor: COLORS.border }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#1E2233]">{eq.type}</div>
                  <div className="text-[12px] text-[#6B7280]">
                    {eq.make} {eq.model}
                  </div>
                </div>
                <Pill className="shrink-0" style={{ background: w.bg, color: w.fg }}>
                  {w.label}
                </Pill>
              </div>
              {/* demo affordances — no real manual/parts catalog behind this
                  data (see EquipmentInfo's doc comment), so these are styled
                  as real buttons but deliberately go nowhere, same category
                  as this file's "Mark done" button above. */}
              {(eq.manualAvailable || eq.partsAvailable) && (
                <div className="flex items-center gap-2 mt-2.5">
                  {eq.manualAvailable && (
                    <button
                      className="h-8 px-3 rounded-full text-[12px] font-semibold active:scale-95 transition-all"
                      style={{ backgroundColor: COLORS.surface, color: COLORS.subtle }}
                    >
                      View manual
                    </button>
                  )}
                  {eq.partsAvailable && (
                    <button
                      className="h-8 px-3 rounded-full text-[12px] font-semibold active:scale-95 transition-all"
                      style={{ backgroundColor: COLORS.surface, color: COLORS.subtle }}
                    >
                      Order parts
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Access/practical notes on file for the property (panel mode only) — gate
// codes, pets, anything a technician should know before arriving. Omitted
// entirely when this property has no PREMISE_NOTES entry (most don't).
function NotesCard({ propertyId }: { propertyId: string }) {
  const notes = PREMISE_NOTES[propertyId];
  if (!notes || notes.length === 0) return null;
  return (
    <Card>
      <div className="flex items-center gap-1.5 mb-2 text-[#6B7280]">
        <StickyNote size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Notes</span>
      </div>
      <div className="flex flex-col gap-2">
        {notes.map((note, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: COLORS.accent }} />
            <span className="text-sm text-[#1E2233] leading-snug">{note}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
