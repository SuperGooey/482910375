import React, { useState, useEffect, useReducer, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  ArrowRightLeft,
  Clock,
  Check,
  Navigation,
  Users,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  ClipboardList,
  X,
  Activity,
  CheckCircle2,
  PhoneIncoming,
  User,
} from "lucide-react";

// ---- design tokens ----
// centralizes the colors driven by inline `style` props — the majority of
// this app's dynamic/computed styling, since we moved color logic to inline
// styles early on after finding Tailwind's arbitrary-value classes (e.g.
// bg-[#3B5BDB]) unreliable for some dynamic cases. Tailwind's className
// utilities can't reference these tokens directly without a Tailwind config
// file, which isn't available in this single-file setup, so a handful of
// static className color usages remain outside this system — a real, known
// gap rather than an oversight. Defined first, before anything else in the
// file, since several top-level consts below reference these immediately.
const COLORS = {
  ink: "#1E2233", // primary text
  subtle: "#454B5C", // secondary text
  muted: "#6B7280", // muted text/labels
  faint: "#9AA0B0", // faintest text, placeholders, timestamps
  accent: "#3B5BDB", // royal blue — primary actions & highlights
  page: "#F6F7FB", // app background
  surface: "#F1F2F8", // neutral fill — inactive buttons, tracks, chips
  border: "#ECEEF5", // card/hairline borders
  success: "#1F9D63",
  successBg: "#E4F7EE",
  warning: "#C98A1D",
  warningBg: "#FFF4DE",
  danger: "#E4534B",
  dangerBg: "#FFE8E8",
  trackInactive: "#E7E8EC", // solid — used where something else (a line, another shape) sits behind it and shouldn't show through
};
// a translucent shade of the base ink color, for borders/tracks/dividers at
// varying opacity — replaces the many one-off rgba(30,34,51,X) literals
function ink(alpha) {
  return `rgba(30,34,51,${alpha})`;
}
// the standard resting elevation used by every card in the app
const CARD_SHADOW = `0 1px 2px ${ink(0.03)}, 0 6px 18px ${ink(0.04)}`;

const CALLER_LATLNG = [37.7912, -122.4013];

const CALLS = [
  {
    id: "c1",
    location: "5th & Main",
    situation: "No hot water — water heater",
    urgency: "high",
    confidence: 92,
    startSeconds: 58,
    flag: null,
    mode: "dispatch",
    resultCaseId: "k1",
    stage: "dispatched",
    latlng: [37.7912, -122.4013],
    contact: {
      name: "Robert Chen",
      matchConfidence: 88,
      matchSource: "Phone + account match",
      notes: ["Active service plan — Premium.", "Preferred technician: M. Alvarez."],
    },
    contextItems: [
      { label: "Service history", detail: "Water heater installed 3 years ago; last serviced 8 months ago for an anode rod replacement." },
      { label: "Warranty status", detail: "Unit still under manufacturer warranty until next year." },
    ],
    script: [
      { who: "caller", phase: "triage", text: "My water heater stopped working, we have no hot water at all." },
      { who: "ai", phase: "triage", text: "Got it. Is this an electric water heater, and have you checked the breaker?" },
      { who: "caller", phase: "triage", text: "It's electric, and the breaker looks fine." },
      { who: "ai", phase: "customer", text: "Thanks. Can you confirm the address for the technician?" },
      { who: "caller", phase: "customer", text: "Yes, it's 5th and Main." },
      { who: "ai", phase: "scheduling", text: "I have a technician nearby who can be there in about 4 minutes — does that work?" },
      { who: "caller", phase: "scheduling", text: "Yes, that works, thank you." },
    ],
    units: [
      { id: "Tech · M. Alvarez", eta: 4, match: 96, tag: "Electrical", lat: 37.7935, lng: -122.4041 },
      { id: "Tech · J. Diaz", eta: 7, match: 81, tag: "Plumbing", lat: 37.7885, lng: -122.3978 },
      { id: "Tech · L. Kim", eta: 11, match: 40, tag: "General", lat: 37.7868, lng: -122.4055 },
    ],
  },
  {
    id: "c2",
    location: "Oak Ave",
    situation: "Gas smell near furnace",
    urgency: "high",
    confidence: 74,
    startSeconds: 21,
    flag: "gas",
    mode: "dispatch",
    resultCaseId: "k9",
    stage: "triaging",
    latlng: [37.7938, -122.3975],
    contact: {
      name: "Unconfirmed resident",
      matchConfidence: 34,
      matchSource: "Address only — no phone match on file",
      notes: ["No account on file for this phone number."],
    },
    banner: {
      title: "Possible gas leak",
      body: "Gas odor near a furnace suggests a leak. Keep the caller from operating switches or the furnace; recommend contacting the gas utility, and confirm shutoff before a technician enters.",
    },
    contextItems: [
      { label: "Gas leak safety protocol", detail: "Do not operate switches or appliances. Ventilate the area. Only gas-certified technicians should enter." },
      { label: "Prior call at this address", detail: "None on record." },
      { label: "Appliance reference", detail: "Standard gas furnace — shutoff valve typically at the gas line entry point." },
    ],
    script: [
      { who: "caller", phase: "triage", text: "I smell gas near the furnace in the basement." },
      { who: "ai", phase: "triage", text: "Don't touch any switches. Can you leave the area and open a window on your way out?" },
      { who: "caller", phase: "triage", text: "Okay, doing that now." },
      { who: "ai", phase: "customer", text: "I've got your address as Oak Ave — is that correct?" },
      { who: "caller", phase: "customer", text: "Yes, that's right." },
      { who: "ai", phase: "scheduling", text: "I'm sending a gas-certified technician now, about 6 minutes out." },
      { who: "caller", phase: "scheduling", text: "Okay, please hurry." },
    ],
    units: [
      { id: "Tech · D. Ruiz", eta: 6, match: 94, tag: "Gas Certified", lat: 37.7945, lng: -122.3995 },
      { id: "Tech · S. Patel", eta: 8, match: 55, tag: "HVAC", lat: 37.789, lng: -122.4062 },
      { id: "Tech · K. Nguyen", eta: 10, match: 48, tag: "General", lat: 37.796, lng: -122.397 },
    ],
  },
  {
    id: "c3",
    location: "Birch St",
    situation: "AC not cooling",
    urgency: "low",
    confidence: 88,
    startSeconds: 130,
    flag: null,
    mode: "dispatch",
    resultCaseId: "k10",
    confirmedName: "Dana Whitfield",
    stage: "triaging",
    latlng: [37.7875, -122.403],
    contextItems: [
      { label: "System reference", detail: "Central AC unit, approx. 8 years old based on service history." },
      { label: "Prior calls at this address", detail: "None on record." },
    ],
    script: [
      { who: "caller", phase: "triage", text: "My AC is running but it's not cooling the house at all." },
      { who: "ai", phase: "triage", text: "Got it. Is the outdoor unit making any noise, or is it just not turning on?" },
      { who: "caller", phase: "triage", text: "It's just not turning on at all." },
      { who: "ai", phase: "customer", text: "Thanks. Can I get your name for our records?" },
      { who: "caller", phase: "customer", text: "It's Dana Whitfield." },
      { who: "ai", phase: "scheduling", text: "I can get a technician out in about 9 minutes — does that work?" },
      { who: "caller", phase: "scheduling", text: "Yes, that's fine." },
    ],
    units: [
      { id: "Tech · A. Brooks", eta: 9, match: 88, tag: "HVAC", lat: 37.787, lng: -122.401 },
      { id: "Tech · R. Lopez", eta: 14, match: 62, tag: "HVAC", lat: 37.793, lng: -122.409 },
    ],
  },
  {
    id: "c4",
    location: "Maple Dr",
    situation: "Leaky kitchen faucet",
    urgency: "low",
    confidence: 81,
    startSeconds: 15,
    flag: null,
    mode: "schedule",
    resultCaseId: "k5",
    stage: "dispatching",
    latlng: [37.79, -122.406],
    contact: {
      name: "Priya Shah",
      matchConfidence: 96,
      matchSource: "CRM account — phone match",
      notes: ["Preferred technician: J. Alvarez", "Gate code: 4821", "Last service: Oct 2025 — garbage disposal"],
    },
    contextItems: [
      { label: "Service history", detail: "This address was serviced 14 months ago for a different fixture." },
      { label: "Equipment reference", detail: "Standard single-handle kitchen faucet — cartridge replacement is the likely fix." },
    ],
    script: [
      { who: "caller", phase: "triage", text: "My kitchen faucet has been dripping for a couple days, not an emergency." },
      { who: "ai", phase: "triage", text: "Got it, sounds like it's not urgent. Is it a steady drip or occasional?" },
      { who: "caller", phase: "triage", text: "Pretty steady, especially when the water's off." },
      { who: "ai", phase: "customer", text: "Thanks. Can I confirm this is for the address on Maple Dr?" },
      { who: "caller", phase: "customer", text: "Yes, that's right." },
      { who: "ai", phase: "scheduling", text: "I can get someone out tomorrow morning — does 10am work?" },
      { who: "caller", phase: "scheduling", text: "Yeah, that works." },
    ],
    units: [
      { id: "Tech · J. Alvarez", eta: null, match: 90, tag: "Plumbing", lat: 37.792, lng: -122.404, scheduledTime: "Tomorrow · 10:00 AM" },
      { id: "Tech · R. Kim", eta: null, match: 74, tag: "Plumbing", lat: 37.786, lng: -122.398, scheduledTime: "Tomorrow · 1:30 PM" },
    ],
  },
];

const CASES = [
  {
    id: "k1",
    unit: "Tech · M. Alvarez",
    location: "5th & Main",
    status: "en_route",
    meta: "ETA 3 min",
    latlng: [37.7912, -122.4013],
    contact: { name: "Robert Chen", matchConfidence: 88, matchSource: "Phone + account match" },
    contextItems: [{ label: "Service history", detail: "Water heater installed 3 years ago; still under warranty." }],
  },
  {
    id: "k2",
    unit: "Tech · D. Ruiz",
    location: "Cedar Blvd",
    status: "on_scene",
    meta: "On scene 6 min",
    latlng: [37.7955, -122.409],
  },
  {
    id: "k3",
    unit: "Tech · J. Diaz",
    location: "Park Row",
    status: "resolved",
    cost: 340,
    note: "Replaced water heater heating element, restored hot water.",
    followUp: false,
    latlng: [37.786, -122.395],
    contextItems: [{ label: "Dispatch rationale", detail: "Electrical-certified technician selected; no plumbing parts required." }],
  },
  {
    id: "k4",
    unit: "Tech · S. Patel",
    location: "Willow Ct",
    status: "resolved",
    cost: 210,
    note: "Repaired a minor gas leak at the kitchen range connection.",
    followUp: true,
    followUpNote: "Send updated safety inspection certificate to homeowner",
    latlng: [37.783, -122.41],
    contextItems: [{ label: "Prior incidents", detail: "No prior gas-related calls at this property." }],
  },
  {
    id: "k5",
    unit: "Tech · J. Alvarez",
    location: "Maple Dr",
    status: "scheduled",
    date: "2026-08-13",
    time: "10:00 AM",
    durationMin: 90,
    meta: "Tomorrow · 10:00 AM",
    latlng: [37.79, -122.406],
    contact: { name: "Priya Shah", matchConfidence: 96, matchSource: "CRM account — phone match" },
    contextItems: [{ label: "Service history", detail: "Same technician serviced this address 14 months ago." }],
  },
  {
    id: "k6",
    unit: "Tech · R. Kim",
    location: "Grove Ave",
    status: "scheduled",
    date: "2026-08-13",
    time: "1:30 PM",
    durationMin: 60,
    meta: "Tomorrow · 1:30 PM",
    latlng: [37.7968, -122.401],
    contact: null,
    contextItems: [{ label: "Job type", detail: "Faucet installation quote follow-up." }],
  },
  {
    id: "k7",
    unit: "Tech · S. Patel",
    location: "Cedar Blvd",
    status: "scheduled",
    date: "2026-08-14",
    time: "9:30 AM",
    durationMin: 60,
    meta: "Fri · 9:30 AM",
    latlng: [37.7955, -122.409],
    contact: { name: "Alicia Fenwick", matchConfidence: 74, matchSource: "CRM account" },
    contextItems: [{ label: "Job type", detail: "Furnace inspection." }],
  },
  {
    id: "k8",
    unit: "Tech · A. Brooks",
    location: "Pine St",
    status: "scheduled",
    date: "2026-08-18",
    time: "9:00 AM",
    durationMin: 90,
    meta: "Tue · 9:00 AM",
    latlng: [37.7842, -122.408],
    contact: { name: "Grace Liu", matchConfidence: 68, matchSource: "Phone match" },
    contextItems: [{ label: "Job type", detail: "Seasonal AC tune-up." }],
  },
  {
    id: "k9",
    unit: "Tech · D. Ruiz",
    location: "Oak Ave",
    status: "en_route",
    meta: "ETA 6 min",
    latlng: [37.7938, -122.3975],
    contact: { name: "Unconfirmed resident", matchConfidence: 34, matchSource: "Address only — no phone match on file" },
    contextItems: [{ label: "Gas leak response protocol", detail: "Evacuate to 50ft, ventilate, no ignition sources." }],
  },
  {
    id: "k10",
    unit: "Tech · A. Brooks",
    location: "Birch St",
    status: "en_route",
    meta: "ETA 9 min",
    latlng: [37.7875, -122.403],
    contact: { name: "Dana Whitfield", matchConfidence: 100, matchSource: "Confirmed verbally on call" },
    contextItems: [{ label: "System reference", detail: "Central AC unit, approx. 8 years old based on service history." }],
  },
];

const MISSED_CALLS = [
  {
    id: "m1",
    location: "Elm St",
    situation: "Unknown — no answer",
    missedAt: "12 min ago",
    reason: "No answer after 4 rings",
    latlng: [37.7895, -122.404],
    contact: null,
  },
  {
    id: "m2",
    location: "Grove Ave",
    situation: "Caller disconnected before describing issue",
    missedAt: "34 min ago",
    reason: "Call dropped before details captured",
    latlng: [37.7968, -122.401],
    contact: { name: "Marcus Webb", matchConfidence: 81, matchSource: "Phone match" },
  },
];

// status: "scheduled" (ended with an appointment booked), "resolved" (fully
// handled, nothing further needed), or "callback" (something's outstanding)
const COMPLETED_CALLS = [
  {
    id: "d1",
    location: "Pine St",
    situation: "AC tune-up request",
    status: "scheduled",
    completedAt: "1h ago",
    duration: "2:40",
    outcome: "Booked a seasonal AC tune-up for next Tuesday at 9:00 AM.",
    latlng: [37.7842, -122.408],
    contact: { name: "Grace Liu", matchConfidence: 68, matchSource: "Phone match" },
  },
  {
    id: "d2",
    location: "Cedar Blvd",
    situation: "Service area coverage question",
    status: "resolved",
    completedAt: "2h ago",
    duration: "1:04",
    outcome: "Confirmed we service this zip code — no follow-up needed.",
    latlng: [37.7955, -122.409],
    contact: { name: "Alicia Fenwick", matchConfidence: 74, matchSource: "CRM account" },
  },
  {
    id: "d3",
    location: "Birch St",
    situation: "Furnace replacement pricing question",
    status: "callback",
    completedAt: "3h ago",
    duration: "2:15",
    outcome: "Caller wants a written quote before booking — needs a callback with pricing details.",
    latlng: [37.7875, -122.403],
    contact: null,
  },
];

const urgencyDot = { high: COLORS.danger, medium: "#F0B94D", low: "#3FBE86" };

// how confident an identity match needs to be before we show the person's
// name instead of a fallback — one constant instead of a magic number
// repeated at every call site that touches contact matching
const CONTACT_MATCH_THRESHOLD = 50;
function displayName(contact, fallback = null) {
  return contact && contact.matchConfidence >= CONTACT_MATCH_THRESHOLD ? contact.name : fallback;
}

// the four stages a call moves through, driving the mini progress tracker in
// the pinned plan bar. "scheduled" is only reached once the plan is confirmed
const CALL_PHASES = [
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
const CALL_CLOCK_TICK_MS = 1000; // elapsed-time counter granularity
const MESSAGE_REVEAL_DELAY_MS = 750; // waveform-to-text delay per message
const MESSAGE_ADVANCE_DELAY_MS = 2200; // gap before the next message appears
const AUTO_CONFIRM_DELAY_MS = 700; // AI-mode pause before auto-confirming, once eligible

// Leaflet measures its container on mount, before our own layout/animation
// has necessarily settled — a short delay lets it re-measure so tiles render
// at the right size instead of clipped/offset
const MAP_RESIZE_SETTLE_DELAY_MS = 150;

// earliest phase at which a plan can be confirmed (by a human or the AI) —
// expressed as a phase key rather than a hardcoded index, so it stays
// correct even if CALL_PHASES is reordered or extended
const MIN_PHASE_FOR_CONFIRM = "scheduling";

function initCallState(call) {
  return {
    mode: "ai", // "ai" (AI dispatch, auto-confirms) | "manual" (human takeover, confirms manually)
    confirmed: false,
    muted: false,
    tab: "call",
    showPicker: false,
    contextDismissed: false,
    ranked: call.units, // technician candidates, ranked; ranked[0] is the assigned tech
    visibleMsgCount: 1, // how many script lines have appeared so far
    revealedMsgIdxs: new Set(), // which appeared lines have finished "speaking" and now show text
    seconds: call.startSeconds,
  };
}

function callReducer(state, action) {
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
function selectCurrentPhaseKey(state, call) {
  if (state.confirmed) return "scheduled";
  const revealedIdxs = [...state.revealedMsgIdxs];
  const lastRevealedIdx = revealedIdxs.length ? Math.max(...revealedIdxs) : -1;
  return lastRevealedIdx >= 0 ? call.script[lastRevealedIdx].phase || "triage" : "triage";
}
function selectCurrentPhaseIndex(state, call) {
  return CALL_PHASES.findIndex((p) => p.key === selectCurrentPhaseKey(state, call));
}
function selectCanConfirm(state, call) {
  const minIdx = CALL_PHASES.findIndex((p) => p.key === MIN_PHASE_FOR_CONFIRM);
  return selectCurrentPhaseIndex(state, call) >= minIdx;
}
// the caller's name can come from a confident CRM/phone match, or simply
// from them stating it during the customer phase — those are two different
// sources and a call can have either, both, or neither
function selectIdentifiedName(call) {
  return displayName(call.contact) || call.confirmedName || null;
}
function selectAssignedTech(state) {
  return state.ranked[0];
}
// earliest phase at which the caller's identity is considered "known" in
// the conversation — mirrors MIN_PHASE_FOR_CONFIRM's pattern, comparing by
// phase key rather than a hardcoded index
const MIN_PHASE_FOR_NAME_REVEAL = "customer";

// the AI's question and the caller's reply share the same phase tag (both
// "customer"), so checking "has the customer phase started" fires as soon
// as the AI *asks* — before the caller has actually said anything. What we
// want is specifically whether the caller has replied within or after that
// phase, which is the real moment their identity becomes known.
function selectNameKnown(state, call) {
  const minIdx = CALL_PHASES.findIndex((p) => p.key === MIN_PHASE_FOR_NAME_REVEAL);
  return call.script.some(
    (m, i) =>
      state.revealedMsgIdxs.has(i) &&
      m.who === "caller" &&
      CALL_PHASES.findIndex((p) => p.key === (m.phase || "triage")) >= minIdx
  );
}

function selectAuthorLabel(state, call, msgIndex) {
  const m = call.script[msgIndex];
  if (m.who !== "caller") return "AI dispatcher";
  return (selectNameKnown(state, call) && selectIdentifiedName(call)) || "Caller";
}

function matchColors(match) {
  if (match >= 85) return { fg: COLORS.success, dot: "#3FBE86" };
  if (match >= 60) return { fg: COLORS.warning, dot: "#F0B94D" };
  return { fg: COLORS.danger, dot: "#F08782" };
}

// ---- lightweight helpers for card-background mini-maps & schedule strips ----
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function polarPos(seed, distancePct) {
  const angle = (seed % 360) * (Math.PI / 180);
  return { x: 50 + distancePct * Math.cos(angle), y: 50 + distancePct * Math.sin(angle) };
}

// Leaflet is loaded once and shared by every map on screen (the big interactive
// map and every small card map) so we never inject duplicate script tags and
// every map goes through the same, already-proven loading path.
let leafletLoadPromise = null;
function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;
  leafletLoadPromise = new Promise((resolve, reject) => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    const scriptId = "leaflet-js";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", () => reject(new Error("leaflet failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("leaflet failed to load"));
    document.body.appendChild(script);
  });
  return leafletLoadPromise;
}

// A small, non-interactive real map used as a card background — same tiles and
// loading path as the big map in call detail, just tiny and frozen in place
// (no drag/zoom handlers) so many of these on screen at once stay cheap.
// mode: "live" (unit en route, dashed line + moving dot), "static" (unit essentially
// on-site), "siteOnly" (no unit dot yet — e.g. a scheduled appointment)
function MiniMap({ seed, distancePct = 26, mode = "live", dim = false, latlng }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [status, setStatus] = useState(latlng ? "loading" : "fallback");
  const pos = polarPos(seed, distancePct);

  useEffect(() => {
    if (!latlng) return;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
          tap: false,
        }).setView(latlng, 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        const tilePane = containerRef.current.querySelector(".leaflet-tile-pane");
        if (tilePane) tilePane.style.filter = "saturate(0.4) brightness(1.22) contrast(0.82)";
        mapRef.current = map;
        setStatus("ready");
        setTimeout(() => map.invalidateSize(), MAP_RESIZE_SETTLE_DELAY_MS);
      })
      .catch(() => !cancelled && setStatus("fallback"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latlng]);

  return (
    <div className={`absolute inset-0 overflow-hidden isolate ${dim ? "grayscale opacity-60" : ""}`}>
      {status !== "fallback" ? (
        <>
          <div ref={containerRef} className="absolute inset-0 bg-[#EEF2FF]" />
          <div className="absolute inset-0 bg-white/55 pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#EEF2FF] to-[#F7FBF6]" />
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,40 C30,45 60,20 100,30" stroke="#C7CEEB" strokeWidth="1.2" fill="none" />
            <path d="M0,70 C40,65 60,85 100,75" stroke="#C7CEEB" strokeWidth="1.2" fill="none" />
            <path d="M25,0 C30,40 20,70 30,100" stroke="#C7CEEB" strokeWidth="1.2" fill="none" />
          </svg>
        </>
      )}
      {mode === "live" && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="50" y1="50" x2={pos.x} y2={pos.y} stroke={COLORS.accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
        </svg>
      )}
      <div
        className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", backgroundColor: COLORS.accent }}
      />
      {mode !== "siteOnly" && (
        <div
          className="absolute w-2 h-2 rounded-full bg-[#3FBE86] border-2 border-white shadow"
          style={{
            left: `${mode === "static" ? 55 : pos.x}%`,
            top: `${mode === "static" ? 52 : pos.y}%`,
            transform: "translate(-50%,-50%)",
          }}
        />
      )}
    </div>
  );
}

function whenPill(call) {
  if (call.mode === "schedule") return call.units[0].scheduledTime;
  const eta = call.units[0].eta;
  return `${eta} min · ${(eta * 0.4).toFixed(1)} mi`;
}

// the queue card's stage badge — collapses "what's this call's status" into one
// small indicator instead of a separate progress stepper + a separate flag badge
function callStage(c) {
  if (c.flag) {
    return { label: "Needs review", color: COLORS.danger, bg: COLORS.dangerBg, icon: AlertTriangle, pulse: true };
  }
  if (c.stage === "triaging") {
    return { label: "Triaging", color: COLORS.accent, bg: "white/90", icon: Activity, pulse: true };
  }
  if (c.stage === "dispatching") {
    return {
      label: c.mode === "schedule" ? "Scheduling" : "Dispatching",
      color: COLORS.accent,
      bg: "white/90",
      icon: Activity,
      pulse: true,
    };
  }
  return {
    label: c.mode === "schedule" ? "Scheduled" : "Dispatched",
    color: COLORS.success,
    bg: "white/90",
    icon: CheckCircle2,
    pulse: false,
  };
}

const caseMapMode = { en_route: "live", on_scene: "static", resolved: "static", scheduled: "siteOnly" };

function unitSchedule(id) {
  const seed = hashSeed(id);
  return Array.from({ length: 8 }).map((_, i) => ((seed >> i) & 1) === 0);
}

function nextFreeLabel(slots) {
  const idx = slots.findIndex(Boolean);
  if (idx === 0) return "Free now";
  if (idx === -1) return "Busy today";
  const totalMin = idx * 30;
  let h = 14 + Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `Free at ${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const hairline = { border: `0.5px solid ${ink(0.16)}` };

// native-style translucent bar: frosted, saturated, fades to transparent at the
// edge that meets scrolling content instead of a hard divider line
const FROSTED_BG = "rgba(246,247,251,0.94)";
const FROSTED_FILTER = "blur(20px) saturate(120%)";
function frostedStyle(direction) {
  const gradient =
    direction === "down"
      ? "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)"
      : "linear-gradient(to top, black 0%, black 65%, transparent 100%)";
  return {
    backgroundColor: FROSTED_BG,
    backdropFilter: FROSTED_FILTER,
    WebkitBackdropFilter: FROSTED_FILTER,
    maskImage: gradient,
    WebkitMaskImage: gradient,
  };
}

// stands in for a chat bubble's content while that turn is "being spoken",
// before it resolves into transcribed text — reinforces that this is a live
// voice call, not a text thread
// a standardized loading placeholder for card rows whose info hasn't been
// collected yet — keeps the card's layout fixed instead of growing/shrinking
// as fields resolve
function SkeletonBar({ width = 100, height = 11 }) {
  return (
    <span
      className="inline-block rounded-full animate-pulse"
      style={{ width, height, backgroundColor: ink(0.09) }}
    />
  );
}

function Waveform({ color = "currentColor" }) {
  const bars = [0.5, 0.9, 0.35, 1, 0.6];
  return (
    <div className="flex items-center gap-[3px] h-4" aria-hidden="true">
      <style>{`@keyframes waveBar{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}`}</style>
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-[3px] h-full rounded-full"
          style={{
            backgroundColor: color,
            animation: `waveBar ${0.7 + b * 0.3}s ease-in-out ${i * 0.11}s infinite`,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}

function Pill({ children, className = "", style, size = 11, weight = 500 }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${className}`}
      style={{ fontSize: size, fontWeight: weight, ...hairline, ...style }}
    >
      {children}
    </span>
  );
}

function IconButton({ icon: Icon, active, danger, onClick, label, size = "md" }) {
  const dims = size === "sm" ? "w-9 h-9 rounded-full" : "w-12 h-12 rounded-full";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${dims} flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95
        ${danger ? "bg-[#FFE8E8] text-[#E4534B] hover:bg-[#ffd9d9]" : !active ? "bg-[#F1F2F8] text-[#454B5C] hover:bg-[#e7e9f4]" : ""}`}
      style={active && !danger ? { backgroundColor: COLORS.accent, color: "#FFFFFF" } : undefined}
    >
      <Icon size={size === "sm" ? 15 : 19} strokeWidth={2} />
    </button>
  );
}

// ---- real squircle corners, computed in JS ----
// corner-shape:squircle isn't supported in Safari yet, but the curve itself is
// just a superellipse — given an element's measured size and a target radius,
// we can compute the exact clip path ourselves and it works everywhere today.
function useSquirclePath(radius, n = 5, steps = 10) {
  const ref = useRef(null);
  const [clipPath, setClipPath] = useState(null);
  const radiusKey = Array.isArray(radius) ? radius.join(",") : radius;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const [rtl, rtr, rbr, rbl] = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
      const clamp = (r) => Math.min(r, w / 2, h / 2);
      const rTL = clamp(rtl);
      const rTR = clamp(rtr);
      const rBR = clamp(rbr);
      const rBL = clamp(rbl);

      const corner = (cx, cy, r, startAngle) => {
        const pts = [];
        for (let i = 0; i <= steps; i++) {
          const t = startAngle + (Math.PI / 2) * (i / steps);
          const cosT = Math.cos(t);
          const sinT = Math.sin(t);
          const x = cx + Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n) * r;
          const y = cy + Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n) * r;
          pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        return pts;
      };

      // clockwise from the left edge of the top-left corner
      const pts = [
        ...corner(rTL, rTL, rTL, Math.PI),
        ...corner(w - rTR, rTR, rTR, -Math.PI / 2),
        ...corner(w - rBR, h - rBR, rBR, 0),
        ...corner(rBL, h - rBL, rBL, Math.PI / 2),
      ];
      setClipPath(`path("M ${pts.join(" L ")} Z")`);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKey, n, steps]);

  return [ref, clipPath];
}

// drop-in wrapper: renders as any tag, clips to a true squircle once measured,
// falls back to a plain rounded corner (via borderRadius) until then.
// radius can be a single number, or [topLeft, topRight, bottomRight, bottomLeft]
function Squircle({ as: Tag = "div", radius = 20, className = "", style = {}, children, ...rest }) {
  const [ref, clipPath] = useSquirclePath(radius);
  const borderRadius = Array.isArray(radius) ? radius.map((r) => `${r}px`).join(" ") : radius;
  return (
    <Tag ref={ref} className={className} style={{ ...style, borderRadius, clipPath: clipPath || undefined }} {...rest}>
      {children}
    </Tag>
  );
}

// for cards that need BOTH a true squircle curve AND a shadow. Putting a
// blurred shadow and a precise clip-path on the same element is what caused
// the corner mismatch we chased for a while — box-shadow/filter and
// clip-path don't reliably composite together at the pixel level. The fix is
// to never let them compete: the shadow lives on an outer, unclipped
// wrapper with an ordinary (circular-arc) border-radius — good enough,
// since blur erases the difference between that and a true squircle curve
// at any shadow strength we actually use — while the inner element does the
// real, precise squircle clip and border, with nothing else on it.
function SquircleCard({ as: Tag = "div", radius = 20, className = "", borderColor = COLORS.border, shadow, onClick, children, ...rest }) {
  const [ref, clipPath] = useSquirclePath(radius);
  const borderRadius = Array.isArray(radius) ? radius.map((r) => `${r}px`).join(" ") : radius;
  return (
    <div style={{ borderRadius, boxShadow: shadow }}>
      <Tag
        ref={ref}
        onClick={onClick}
        className={`relative ${className}`}
        style={{ borderRadius, clipPath: clipPath || undefined }}
        {...rest}
      >
        {children}
        {/* the border lives on its own overlay, painted after (so on top
            of) everything else in the card — otherwise opaque children
            like a full-bleed map paint over an inset box-shadow border,
            since that's a background-layer effect that sits behind
            normal child content */}
        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius, boxShadow: `inset 0 0 0 1px ${borderColor}` }} />
      </Tag>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <SquircleCard radius={24} className={`bg-white p-5 ${className}`} shadow={CARD_SHADOW}>
      {children}
    </SquircleCard>
  );
}

function ContactCard({ contact }) {
  const c = matchColors(contact.matchConfidence);
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#EEF1FD] flex items-center justify-center shrink-0">
            <User size={15} className="text-[#3B5BDB]" />
          </div>
          <div className="text-[14px] font-semibold truncate">{contact.name}</div>
        </div>
        <Pill className="shrink-0" style={{ color: c.fg, backgroundColor: c.dot + "22" }}>
          {contact.matchConfidence}%
        </Pill>
      </div>
      <div className="text-[11px] text-[#6B7280] mb-2">{contact.matchSource}</div>
      {contact.notes && contact.notes.length > 0 && (
        <div className="flex flex-col gap-1">
          {contact.notes.map((n, i) => (
            <div key={i} className="text-[12px] text-[#454B5C] leading-snug">
              · {n}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------- Street map ----------------
function StreetMap({ ranked, height = "100%" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    function initMap(L) {
      if (cancelled || !containerRef.current || mapRef.current) return;
      try {
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: false,
        }).setView(CALLER_LATLNG, 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        const tilePane = containerRef.current.querySelector(".leaflet-tile-pane");
        if (tilePane) tilePane.style.filter = "saturate(0.42) brightness(1.18) contrast(0.85)";
        const callerIcon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:16px;height:16px;">
                   <div style="position:absolute;inset:-8px;border-radius:9999px;background:#3B5BDB33;animation:pulseRing 1.8s ease-out infinite;"></div>
                   <div style="position:relative;width:16px;height:16px;border-radius:9999px;background:#3B5BDB;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);"></div>
                 </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker(CALLER_LATLNG, { icon: callerIcon }).addTo(map);
        ranked.forEach((u) => {
          const c = matchColors(u.match);
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:13px;height:13px;border-radius:9999px;background:${c.dot};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);opacity:${
              u.match < 45 ? 0.5 : 1
            };"></div>`,
            iconSize: [13, 13],
            iconAnchor: [6, 6],
          });
          L.marker([u.lat, u.lng], { icon }).addTo(map);
        });
        mapRef.current = map;
        setStatus("ready");
        setTimeout(() => map.invalidateSize(), MAP_RESIZE_SETTLE_DELAY_MS);
      } catch (e) {
        setStatus("fallback");
      }
    }
    loadLeaflet()
      .then((L) => !cancelled && initMap(L))
      .catch(() => !cancelled && setStatus("fallback"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "fallback") return <AbstractMap ranked={ranked} />;

  return (
    <div className="relative w-full isolate" style={{ height }}>
      <style>{`@keyframes pulseRing{0%{transform:scale(0.6);opacity:0.6}100%{transform:scale(1.8);opacity:0}}`}</style>
      <div ref={containerRef} className="w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: COLORS.page }}>
          <div className="w-5 h-5 rounded-full border-2 border-[#3B5BDB] border-t-transparent animate-spin" />
        </div>
      )}
      <div className="absolute top-3 left-3 pointer-events-none">
        <Pill className="bg-white/90 text-[#454B5C] shadow-sm">
          <Navigation size={11} /> Nearby
        </Pill>
      </div>
    </div>
  );
}

function AbstractMap({ ranked }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#F7FBF6]">
      <div className="absolute" style={{ left: "46%", top: "48%" }}>
        <span className="absolute -inset-3 rounded-full animate-ping" style={{ backgroundColor: "rgba(59,91,219,0.2)" }} />
        <span className="relative block w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: COLORS.accent }} />
      </div>
      {ranked.map((u, i) => {
        const c = matchColors(u.match);
        const x = 20 + ((i * 37) % 60);
        const y = 20 + ((i * 53) % 60);
        return (
          <div
            key={u.id}
            className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow"
            style={{ left: `${x}%`, top: `${y}%`, background: c.dot, opacity: u.match < 45 ? 0.45 : 1 }}
          />
        );
      })}
    </div>
  );
}

function UnitCard({ u, centerLatLng }) {
  const c = matchColors(u.match);
  const slots = unitSchedule(u.id);
  const seed = hashSeed(u.id);
  const distancePct = Math.min(38, (u.eta || 6) * 3);
  return (
    <SquircleCard radius={18} className="overflow-hidden bg-white">
      <div className="relative h-16">
        <MiniMap seed={seed} distancePct={distancePct} mode="live" latlng={centerLatLng} />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 to-transparent" />
        <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
          <span className="text-[13px] font-semibold truncate">{u.id}</span>
          <Pill className="bg-white/90 text-[#6B7280] shrink-0">{u.tag}</Pill>
        </div>
        <div className="absolute top-1.5 right-2">
          <Pill className="bg-white/90 shrink-0" style={{ color: c.fg }}>
            {u.match}%
          </Pill>
        </div>
      </div>
      <div className="px-2.5 py-2 bg-[#FAFAFC]">
        <div className="flex items-center gap-1 mb-1.5">
          {slots.map((free, i) => (
            <span
              key={i}
              className="flex-1 h-1.5 rounded-full"
              style={{ background: free ? "#D9F2E6" : "#E7E8F1" }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {u.eta != null ? `${u.eta} min away` : u.scheduledTime}
          </span>
          <span>{nextFreeLabel(slots)}</span>
        </div>
      </div>
    </SquircleCard>
  );
}

// ---------------- Queue screen ----------------
// shared shell for every card-list item in the app (Queue, Cases, Missed,
// Completed) — the Squircle sizing/shadow/border, the map background, and
// the two gradient overlays are identical everywhere; only the content
// overlaid on top (passed as children) actually differs between them
function MapCard({ as = "div", onClick, height = "h-28", seed, distancePct = 20, mapMode = "live", dim = false, latlng, topGradient = "via-white/80", bottomGradient = "from-white/70", children }) {
  return (
    <SquircleCard
      as={as}
      radius={18}
      onClick={onClick}
      className={`relative text-left ${height} overflow-hidden w-full ${onClick ? "active:scale-[0.99] transition-all" : ""}`}
      shadow={CARD_SHADOW}
    >
      <MiniMap seed={seed} distancePct={distancePct} mode={mapMode} dim={dim} latlng={latlng} />
      <div className={`absolute inset-0 bg-gradient-to-t from-white ${topGradient} to-transparent`} />
      <div className={`absolute inset-0 bg-gradient-to-b ${bottomGradient} to-transparent`} />
      {children}
    </SquircleCard>
  );
}

function QueueScreen({ calls, onOpen }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {calls.map((c) => {
        const stage = callStage(c);
        const StageIcon = stage.icon;
        return (
          <MapCard
            key={c.id}
            as="button"
            onClick={() => onOpen(c.id)}
            height="h-32"
            seed={hashSeed(c.id)}
            distancePct={c.mode === "schedule" ? 20 : Math.min(38, (c.units[0].eta || 6) * 3)}
            mapMode={c.mode === "schedule" ? "siteOnly" : "live"}
            latlng={c.latlng}
            topGradient="via-white/75"
            bottomGradient="from-white/80"
          >
            <div className="absolute top-2.5 left-2.5">
              <Pill
                size={10}
                weight={600}
                style={{ color: stage.color, background: stage.bg.startsWith("#") ? stage.bg : "rgba(255,255,255,0.9)" }}
              >
                <StageIcon size={11} className={stage.pulse ? "animate-pulse" : ""} />
                {stage.label}
              </Pill>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{whenPill(c)}</Pill>
            </div>

            <div className="absolute bottom-2.5 left-3 right-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: urgencyDot[c.urgency] }} />
                <span className="text-sm font-semibold truncate text-[#1E2233]">{c.situation}</span>
              </div>
              <span className="text-xs text-[#6B7280]">
                {displayName(c.contact) ? `${displayName(c.contact)} · ${c.location}` : c.location}
              </span>
            </div>
          </MapCard>
        );
      })}
    </div>
  );
}

// ---------------- Missed calls screen ----------------
function MissedScreen({ calls }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {calls.map((m) => (
        <MapCard
          key={m.id}
          height="h-28"
          seed={hashSeed(m.id)}
          distancePct={20}
          mapMode="siteOnly"
          dim
          latlng={m.latlng}
          topGradient="via-white/80"
          bottomGradient="from-white/60"
        >
          <div className="absolute top-2.5 left-2.5">
            <Pill size={10} weight={600} className="text-[#E4534B]" style={{ backgroundColor: COLORS.dangerBg }}>
              <PhoneOff size={10} /> Missed
            </Pill>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{m.missedAt}</Pill>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate text-[#1E2233]">
                {displayName(m.contact, m.situation)}
              </div>
              <div className="text-xs text-[#6B7280] truncate">{m.reason} · {m.location}</div>
            </div>
            <button
              className="shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold active:scale-95 transition-all"
              style={{ backgroundColor: COLORS.accent, color: "#FFFFFF" }}
            >
              Call back
            </button>
          </div>
        </MapCard>
      ))}
    </div>
  );
}

// ---------------- Completed calls screen ----------------
const completedStatusStyle = {
  scheduled: { label: "Scheduled", bg: "#F1EEFD", fg: "#7C5CE0" },
  resolved: { label: "Resolved", bg: COLORS.successBg, fg: COLORS.success },
  callback: { label: "Callback needed", bg: COLORS.warningBg, fg: COLORS.warning },
};

function CompletedScreen({ calls }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {calls.map((d) => {
        const s = completedStatusStyle[d.status];
        return (
          <MapCard
            key={d.id}
            height="h-32"
            seed={hashSeed(d.id)}
            distancePct={18}
            mapMode="siteOnly"
            dim
            latlng={d.latlng}
            topGradient="via-white/85"
            bottomGradient="from-white/60"
          >
            <div className="absolute top-2.5 left-2.5">
              <Pill size={10} weight={600} style={{ backgroundColor: s.bg, color: s.fg }}>
                {s.label}
              </Pill>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{d.completedAt} · {d.duration}</Pill>
            </div>

            <div className="absolute bottom-2.5 left-3 right-3">
              <div className="text-sm font-semibold truncate text-[#1E2233]">{d.situation}</div>
              <div className="text-xs text-[#6B7280] truncate mb-1">
                {displayName(d.contact) ? `${displayName(d.contact)} · ` : ""}
                {d.location}
              </div>
              <div className="text-[11px] text-[#454B5C] leading-snug truncate">{d.outcome}</div>
            </div>
          </MapCard>
        );
      })}
    </div>
  );
}

// ---------------- Cases screen ----------------
const statusStyle = {
  en_route: { label: "En route", bg: "#EEF1FD", fg: COLORS.accent },
  on_scene: { label: "On scene", bg: COLORS.warningBg, fg: COLORS.warning },
  resolved: { label: "Resolved", bg: COLORS.successBg, fg: COLORS.success },
  scheduled: { label: "Scheduled", bg: "#F1EEFD", fg: "#7C5CE0" },
};

function CaseCard({ k, onOpen }) {
  const s = statusStyle[k.status];
  const dim = k.status === "resolved";
  return (
    <MapCard
      as="button"
      onClick={() => onOpen(k.id)}
      height={k.status === "resolved" ? "h-32" : "h-28"}
      seed={hashSeed(k.id)}
      distancePct={22}
      mapMode={caseMapMode[k.status]}
      dim={dim}
      latlng={k.latlng}
      topGradient="via-white/75"
      bottomGradient="from-white/80"
    >
      <div className="absolute top-2.5 left-2.5">
        <Pill size={10} weight={600} style={{ background: s.bg, color: s.fg }}>
          {s.label}
        </Pill>
      </div>
      {k.status === "resolved" ? (
        <div className="absolute top-2.5 right-2.5">
          <span
            className="text-[17px] font-bold text-[#1E2233]"
            style={{ textShadow: "0 1px 3px rgba(255,255,255,0.9), 0 1px 3px rgba(255,255,255,0.9)" }}
          >
            ${k.cost}
          </span>
        </div>
      ) : (
        k.meta && (
          <div className="absolute top-2.5 right-2.5">
            <Pill className="bg-white/95 text-[#1E2233] shadow-sm">{k.meta}</Pill>
          </div>
        )
      )}

      <div className="absolute bottom-2.5 left-3 right-3">
        <div className="text-sm font-semibold truncate text-[#1E2233]">{k.unit}</div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[#6B7280]">
            {displayName(k.contact) ? `${displayName(k.contact)} · ${k.location}` : k.location}
          </span>
          {k.status === "resolved" && k.followUp && (
            <Pill size={10} weight={500} className="text-[#C98A1D] bg-[#FFF4DE] shrink-0">
              <AlertTriangle size={10} /> Follow-up
            </Pill>
          )}
        </div>
        {k.status === "resolved" && k.note && (
          <div className="text-[11px] text-[#454B5C] leading-snug truncate mt-0.5">{k.note}</div>
        )}
      </div>
    </MapCard>
  );
}

function CasesScreen({ cases, onOpen }) {
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {cases.map((k) => (
        <CaseCard key={k.id} k={k} onOpen={onOpen} />
      ))}
    </div>
  );
}

// ---------------- Scheduled jobs: calendar + technician filter ----------------
function initials(techName) {
  const parts = techName.replace("Tech · ", "").split(" ").filter(Boolean);
  return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function parseTimeToMinutes(t) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 9 * 60;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

// the board always represents this 7-day window; zoom controls how much of
// it is visible in the canvas at once — not the size of anything directly
const WEEK_START = "2026-08-12";
const WEEK_DAYS = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(`${WEEK_START}T00:00:00`);
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});
const DAY_START_MIN = 8 * 60; // business hours 8:00
const DAY_END_MIN = 18 * 60; // through 18:00
const DAY_SPAN = DAY_END_MIN - DAY_START_MIN; // 600 minutes/day
const WEEK_SPAN = DAY_SPAN * WEEK_DAYS.length; // total minutes across the week

// zoom 0 = the whole week fits the canvas, zoom 1 = a single hour fills it.
// Exponential rather than linear interpolation, since "how much time is
// visible" is the kind of range that feels even across a slider on a log
// scale (like a map), not a linear one.
function visibleMinutesForZoom(zoom) {
  return WEEK_SPAN * Math.pow(60 / WEEK_SPAN, zoom);
}

function weekMinutesFor(dateIso, timeStr) {
  const dayIdx = WEEK_DAYS.indexOf(dateIso);
  if (dayIdx === -1) return null;
  const tMin = Math.max(0, Math.min(DAY_SPAN, parseTimeToMinutes(timeStr) - DAY_START_MIN));
  return dayIdx * DAY_SPAN + tMin;
}

function ZoomSlider({ value, onChange }) {
  const trackRef = useRef(null);
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={() => onChange(Math.max(0, value - 0.1))}
        aria-label="Zoom out (show more time)"
        className="w-7 h-7 rounded-full bg-[#F1F2F8] flex items-center justify-center text-[#454B5C] text-[14px] font-bold active:scale-95 transition-all shrink-0"
      >
        –
      </button>
      <div ref={trackRef} className="relative flex-1 h-6 flex items-center">
        <div className="absolute left-0 right-0 h-1 rounded-full" style={{ backgroundColor: ink(0.14) }} />
        <div
          className="absolute left-0 h-1 rounded-full"
          style={{ width: `${value * 100}%`, backgroundColor: COLORS.accent }}
        />
        {ZOOM_TICKS.map((t) => (
          <div
            key={t}
            className="absolute w-[3px] h-[3px] rounded-full pointer-events-none"
            style={{
              left: `${t * 100}%`,
              transform: "translateX(-50%)",
              backgroundColor: t <= value ? "rgba(255,255,255,0.8)" : "#C7CEEB",
            }}
          />
        ))}
        <input
          type="range"
          min={0}
          max={100}
          value={value * 100}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label="Timeline zoom level"
          aria-valuetext={value < 0.2 ? "Full week visible" : value > 0.8 ? "One hour visible" : "Partial day visible"}
          className="absolute inset-0 w-full appearance-none bg-transparent"
          style={{ opacity: 0, cursor: "pointer", touchAction: "pan-x" }}
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-white pointer-events-none"
          style={{
            left: `calc(${value * 100}% - 8px)`,
            border: `1px solid ${ink(0.16)}`,
            boxShadow: `0 1px 3px ${ink(0.2)}`,
          }}
        />
      </div>
      <button
        onClick={() => onChange(Math.min(1, value + 0.1))}
        aria-label="Zoom in (show more detail)"
        className="w-7 h-7 rounded-full bg-[#F1F2F8] flex items-center justify-center text-[#454B5C] text-[14px] font-bold active:scale-95 transition-all shrink-0"
      >
        +
      </button>
    </div>
  );
}
const ZOOM_TICKS = [0, 0.46, 1]; // week / ~one day / one hour — reference marks only

// technician tracks with jobs placed as clips along a shared time axis — the
// mobile-friendly analog of a video editor's timeline, so every tech's
// availability for the day is visible at once instead of one at a time
function TimelineBoard({ technicians, jobs, onOpen, focusDate }) {
  const [zoom, setZoom] = useState(0.46); // default to roughly a day's worth visible
  const viewportRef = useRef(null);
  const [viewportW, setViewportW] = useState(280);
  const [scrollLeft, setScrollLeft] = useState(0);
  const AVATAR_COL = 52;
  const RULER_H = 24;
  const ROW_H = 58;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportW(el.offsetWidth - AVATAR_COL));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleMinutes = visibleMinutesForZoom(zoom);
  const pxPerMin = viewportW / visibleMinutes;
  const trackWidth = WEEK_SPAN * pxPerMin;
  const showHourLabels = pxPerMin * 60 > 26; // only legible once zoomed in enough
  const canScrollLeft = scrollLeft > 4;
  const canScrollRight = scrollLeft + viewportW < trackWidth - 4;

  // scroll the board so the focused day is in view whenever it (or the zoom
  // level, which changes how much fits on screen) changes
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !focusDate) return;
    const dayIdx = WEEK_DAYS.indexOf(focusDate);
    if (dayIdx === -1) return;
    el.scrollTo({ left: Math.max(0, dayIdx * DAY_SPAN * pxPerMin - 12), behavior: "smooth" });
  }, [focusDate, pxPerMin]);

  // per-row: is any of this tech's jobs entirely outside the current visible
  // window? computed here (not nested inside the scrolling track) so it's a
  // simple list of {top, side} markers we can render as fixed overlays —
  // sticky elements buried several levels deep inside a horizontally
  // scrolling structure are fragile across browsers, plain position math isn't
  const rowMarkers = technicians.flatMap((tech, rowIdx) => {
    const positions = jobs
      .filter((j) => j.unit === tech)
      .map((j) => {
        const startMin = weekMinutesFor(j.date, j.time);
        if (startMin == null) return null;
        const left = startMin * pxPerMin;
        const width = Math.max((j.durationMin || 60) * pxPerMin, 6);
        return { left, right: left + width };
      })
      .filter(Boolean);
    const top = RULER_H + rowIdx * ROW_H + ROW_H / 2;
    const marks = [];
    if (positions.some((p) => p.right < scrollLeft)) marks.push({ side: "left", top });
    if (positions.some((p) => p.left > scrollLeft + viewportW)) marks.push({ side: "right", top });
    return marks;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-0.5 w-full">
        <span className="text-[11px] text-[#9AA0B0] shrink-0">Week</span>
        <ZoomSlider value={zoom} onChange={setZoom} />
        <span className="text-[11px] text-[#9AA0B0] shrink-0">Hour</span>
      </div>

      <SquircleCard as="div" radius={18} className="relative overflow-hidden bg-white">
        <div
          ref={viewportRef}
          className="overflow-x-auto"
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div style={{ width: trackWidth + AVATAR_COL }}>
            {/* ruler: day dividers always shown, hour ticks only once legible */}
            <div className="flex sticky top-0 z-10 bg-white border-b border-[#ECEEF5]">
              <div
                className="shrink-0 sticky left-0 z-20 bg-white"
                style={{ width: AVATAR_COL, borderRight: `1px solid ${ink(0.1)}` }}
              />
              <div className="relative" style={{ width: trackWidth, height: RULER_H }}>
                {WEEK_DAYS.map((iso, i) => {
                  const d = new Date(`${iso}T00:00:00`);
                  const left = i * DAY_SPAN * pxPerMin;
                  return (
                    <div key={iso} className="absolute top-0 bottom-0 border-l border-[#ECEEF5]" style={{ left }}>
                      <span className="absolute top-0.5 left-1.5 text-[9px] font-semibold text-[#454B5C] whitespace-nowrap">
                        {d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}
                      </span>
                    </div>
                  );
                })}
                {showHourLabels &&
                  WEEK_DAYS.map((iso, i) =>
                    Array.from({ length: DAY_SPAN / 60 + 1 }).map((_, h) => {
                      const hour = 8 + h;
                      const left = (i * DAY_SPAN + h * 60) * pxPerMin;
                      return (
                        <div
                          key={`${iso}-${hour}`}
                          className="absolute bottom-0.5 text-[8px] text-[#9AA0B0]"
                          style={{ left: left + 2 }}
                        >
                          {hour > 12 ? hour - 12 : hour}
                          {hour >= 12 ? "p" : "a"}
                        </div>
                      );
                    })
                  )}
              </div>
            </div>

            {/* technician tracks */}
            {technicians.map((tech) => {
              const techJobs = jobs.filter((j) => j.unit === tech);
              return (
                <div key={tech} className="flex border-b border-[#ECEEF5] last:border-b-0">
                  <div
                    className="shrink-0 sticky left-0 z-10 bg-white flex items-center justify-center py-3"
                    style={{ width: AVATAR_COL, height: ROW_H, borderRight: `1px solid ${ink(0.1)}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      {initials(tech)}
                    </div>
                  </div>
                  <div className="relative" style={{ width: trackWidth, height: ROW_H }}>
                    {WEEK_DAYS.map((iso, i) => (
                      <div
                        key={iso}
                        className="absolute top-0 bottom-0 border-l border-[#F1F2F8]"
                        style={{ left: i * DAY_SPAN * pxPerMin }}
                      />
                    ))}
                    {techJobs.map((j) => {
                      const startMin = weekMinutesFor(j.date, j.time);
                      if (startMin == null) return null;
                      const dur = j.durationMin || 60;
                      const left = startMin * pxPerMin;
                      const width = Math.max(dur * pxPerMin, 6);
                      const wide = width > 60;
                      return (
                        <Squircle
                          as="button"
                          radius={8}
                          key={j.id}
                          onClick={() => onOpen(j.id)}
                          className="absolute top-2.5 text-left overflow-hidden active:scale-95 transition-all"
                          style={{
                            left,
                            width,
                            height: 38,
                            backgroundColor: COLORS.accent,
                            color: "#FFFFFF",
                            padding: wide ? "4px 8px" : "2px",
                          }}
                        >
                          {wide ? (
                            <>
                              <div className="text-[10px] font-semibold truncate">{j.time}</div>
                              <div className="text-[9px] truncate opacity-90">{j.location}</div>
                            </>
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </Squircle>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* fade where the sticky avatar column meets the scrolling tracks —
            strengthens into a "more to scroll" fade when there's content that way */}
        {canScrollLeft && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: AVATAR_COL, width: 18, background: "linear-gradient(to right, #FFFFFF, transparent)" }}
          />
        )}
        {canScrollRight && (
          <div
            className="absolute top-0 bottom-0 right-0 pointer-events-none"
            style={{ width: 18, background: "linear-gradient(to left, #FFFFFF, transparent)" }}
          />
        )}

        {/* "there's a job that way, off-screen" markers — plain fixed overlays
            positioned by row index, sitting outside the scrolling structure
            entirely so they don't depend on nested sticky behavior */}
        {rowMarkers.map((m, i) => (
          <div
            key={i}
            className="absolute w-1 h-5 rounded-full pointer-events-none"
            style={{
              [m.side]: m.side === "left" ? AVATAR_COL + 3 : 3,
              top: m.top - 10,
              backgroundColor: COLORS.accent,
              opacity: 0.6,
              zIndex: 20,
            }}
          />
        ))}
      </SquircleCard>
    </div>
  );
}

function ScheduledView({ cases, onOpen }) {
  const technicians = Array.from(new Set(cases.map((k) => k.unit)));

  // opens scrolled to the first day that actually has jobs — the week-view
  // zoom level already shows the whole week, so there's no separate day
  // picker needed anymore
  const firstBusyDay = WEEK_DAYS.find((iso) => cases.some((k) => k.date === iso)) || WEEK_DAYS[0];

  return (
    <div className="flex flex-col gap-3 p-4">

      <TimelineBoard technicians={technicians} jobs={cases} onOpen={onOpen} focusDate={firstBusyDay} />
    </div>
  );
}

function CaseDetail({ kase, onBack }) {
  const s = statusStyle[kase.status];
  const dim = kase.status === "resolved";
  return (
    <div className="h-full flex flex-col">
      {/* hero: map extends up behind the header and fades into the page
          background before the content starts, instead of two stacked blocks */}
      <div className="relative shrink-0" style={{ height: 200 }}>
        <MiniMap seed={hashSeed(kase.id)} distancePct={22} mode={caseMapMode[kase.status]} dim={dim} latlng={kase.latlng} />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(246,247,251,0) 0%, rgba(246,247,251,0) 72%, #F6F7FB 100%)" }}
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
          <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center">
            <ChevronLeft size={16} className="text-[#454B5C]" />
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate text-[#1E2233]">{kase.unit}</div>
            <div className="text-xs text-[#454B5C]">{kase.location}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 -mt-8 flex flex-col gap-3">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">Status</span>
            <Pill style={{ background: s.bg, color: s.fg }}>{s.label}</Pill>
          </div>
          {kase.meta && <div className="text-sm text-[#454B5C] mt-1">{kase.meta}</div>}
        </Card>
        {kase.contact && <ContactCard contact={kase.contact} />}
        {kase.contextItems && (
          <Card>
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
        )}
        {kase.status === "resolved" && (
          <>
            <Card>
              <div className="flex items-center gap-1.5 mb-1 text-[#6B7280]">
                <FileText size={13} />
                <span className="text-[11px] font-medium uppercase tracking-wide">Outcome</span>
              </div>
              <div className="text-sm text-[#1E2233]">{kase.note}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-1.5 mb-1 text-[#6B7280]">
                <DollarSign size={13} />
                <span className="text-[11px] font-medium uppercase tracking-wide">Cost</span>
              </div>
              <div className="text-sm text-[#1E2233]">${kase.cost}</div>
            </Card>
            <Card>
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
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- Call detail ----------------
function CallDetail({ call, onBack, onViewJob }) {
  const [state, dispatch] = useReducer(callReducer, call, initCallState);
  const pickerTriggerRef = useRef(null);
  const pickerRef = useRef(null);
  const scrollRef = useRef(null);

  // dialog behavior for the technician picker: Escape closes it, opening
  // moves focus into it, closing returns focus to whatever opened it
  useEffect(() => {
    if (!state.showPicker) return;
    pickerRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") dispatch({ type: "CLOSE_PICKER" });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      pickerTriggerRef.current?.focus();
    };
  }, [state.showPicker]);

  useEffect(() => {
    const t = setInterval(() => dispatch({ type: "TICK_CLOCK" }), CALL_CLOCK_TICK_MS);
    return () => clearInterval(t);
  }, []);

  // each newly-visible message "speaks" for a moment (waveform) before its
  // text resolves — including the first message, on mount
  useEffect(() => {
    if (state.visibleMsgCount === 0) return;
    const idx = state.visibleMsgCount - 1;
    const t = setTimeout(() => dispatch({ type: "REVEAL_MESSAGE", idx }), MESSAGE_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.visibleMsgCount]);

  // advance to the next script line once the current one has had time to land
  useEffect(() => {
    if (state.visibleMsgCount >= call.script.length) return;
    const t = setTimeout(() => dispatch({ type: "ADVANCE_MESSAGE" }), MESSAGE_ADVANCE_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.visibleMsgCount]);

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
  }, [state.mode, canConfirm, state.confirmed]);

  const tabs = [
    { key: "units", label: "Team", icon: Users },
    { key: "call", label: "Call", icon: MessageSquare },
    { key: "context", label: "Context", icon: FileText },
  ];

  return (
    <div className="relative h-full flex flex-col">
      {/* top strip */}
      <div className="relative z-10 px-4 py-2.5 flex items-center gap-2.5 shrink-0" style={frostedStyle("down")}>
        <button onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full bg-[#F1F2F8] flex items-center justify-center shrink-0">
          <ChevronLeft size={16} className="text-[#454B5C]" />
        </button>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight truncate">{call.situation}</div>
          <div className="text-[11px] text-[#6B7280] leading-tight tabular-nums">{mm}:{ss} · {call.location}</div>
        </div>
      </div>

      {/* tab switcher — native-style segmented control, just below the caller info */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <SegmentedControl
          variant="track"
          options={tabs}
          value={state.tab}
          onChange={(tab) => dispatch({ type: "SET_TAB", tab })}
          ariaLabel="Call detail sections"
        />
      </div>

      {/* surfaced context card */}
      {call.banner && !state.contextDismissed && (
        <div className="mx-4 mt-3 mb-3 shrink-0">
          <SquircleCard as="div" radius={18} className="bg-[#FFE8E8] p-3 flex items-start gap-2.5" borderColor="#F5C6C4">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: COLORS.danger }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold" style={{ color: "#8A2E28" }}>{call.banner.title}</div>
              <div className="text-[12px] mt-0.5 leading-snug" style={{ color: "#7A2A25" }}>{call.banner.body}</div>
              <button
                onClick={() => dispatch({ type: "SET_TAB", tab: "context" })}
                className="text-[11px] font-semibold text-[#3B5BDB] mt-1.5"
              >
                View details →
              </button>
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
        <div className="absolute inset-0 overflow-y-auto px-4 pt-1" style={{ paddingBottom: 240 }}>
          {state.tab === "units" && (
            <div className="flex flex-col gap-2.5">
              {state.ranked.map((u) => (
                <UnitCard key={u.id} u={u} centerLatLng={call.latlng} />
              ))}
            </div>
          )}
          {state.tab === "call" && (
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
          )}
          {state.tab === "context" && (
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
          )}
        </div>

        {/* fade where scrolling content passes behind the card — gives the
            pinned card a little visual separation instead of a hard edge */}
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{ height: 210, background: "linear-gradient(to bottom, rgba(246,247,251,0) 0%, #F6F7FB 75%)" }}
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
              <React.Fragment key={p.key}>
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
              </React.Fragment>
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

// ---------------- App shell ----------------
// one shared segmented control for the whole app — variant="track" is the
// native-style light track with a white active segment (used for navigation:
// Team/Call/Context, Live/Missed/History, In progress/Scheduled/Resolved);
// variant="solid" is a white track with a solid accent-filled active segment
// (used for the AI Dispatch / Manual takeover mode switch). stretch controls
// whether segments fill the available width or just size to their label.
function SegmentedControl({ options, value, onChange, variant = "track", stretch = true, disabled = false, ariaLabel }) {
  const trackStyle =
    variant === "track"
      ? { backgroundColor: ink(0.02), border: `1px solid ${ink(0.16)}` }
      : { backgroundColor: "#FFFFFF", border: `1px solid ${ink(0.14)}` };
  // "track" variant is used for navigation (tabs); "solid" is used for a
  // mutually-exclusive mode switch (radio group) — different semantics, so
  // screen readers describe them accurately rather than as generic buttons
  const groupRole = variant === "track" ? "tablist" : "radiogroup";
  const itemRole = variant === "track" ? "tab" : "radio";

  return (
    <div className="flex rounded-full p-1" style={trackStyle} role={groupRole} aria-label={ariaLabel}>
      <div className="flex" style={{ width: stretch ? "100%" : undefined, opacity: disabled ? 0.5 : 1, transition: "opacity 0.3s" }}>
        {options.map((o) => {
          const Icon = o.icon;
          const active = value === o.key;
          const activeStyle =
            variant === "track"
              ? { backgroundColor: "#FFFFFF", color: COLORS.ink, border: `1px solid ${ink(0.16)}` }
              : { backgroundColor: COLORS.accent, color: "#FFFFFF" };
          return (
            <button
              key={o.key}
              role={itemRole}
              aria-selected={variant === "track" ? active : undefined}
              aria-checked={variant === "solid" ? active : undefined}
              onClick={() => !disabled && onChange(o.key)}
              disabled={disabled}
              className={`${stretch ? "flex-1" : ""} flex items-center justify-center gap-1 ${
                variant === "track" ? "py-2 font-medium" : "h-8 px-3 font-semibold"
              } rounded-full text-[11px] transition-all whitespace-nowrap disabled:cursor-not-allowed ${
                active && variant === "track" ? "shadow-sm" : ""
              }`}
              style={active ? activeStyle : { color: COLORS.muted }}
            >
              {Icon && <Icon size={12} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DispatchConsole() {
  const [tab, setTab] = useState("queue"); // queue | cases
  const [queueView, setQueueView] = useState("live"); // live | missed | completed
  const [casesView, setCasesView] = useState("active"); // active | scheduled | resolved
  const [openCallId, setOpenCallId] = useState(null);
  const [openCaseId, setOpenCaseId] = useState(null);

  useEffect(() => {
    // some mobile browsers/webviews auto-invert colors for system dark mode
    // when a page doesn't declare its own scheme, which can override author
    // colors unpredictably. This opts the whole preview out of that.
    let meta = document.querySelector('meta[name="color-scheme"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "light";
    return () => {
      if (created) meta.remove();
      else meta.content = prev;
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
      <style>{`
        /* visible keyboard focus everywhere, without adding a ring on mouse/touch taps */
        button:focus-visible, [role="button"]:focus-visible, input:focus-visible, a:focus-visible {
          outline: 2px solid #3B5BDB;
          outline-offset: 2px;
          border-radius: 8px;
        }
        button:focus:not(:focus-visible) {
          outline: none;
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
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
            ) : (
              casesView === "scheduled" ? (
                <ScheduledView cases={filteredCases} onOpen={setOpenCaseId} />
              ) : (
                <CasesScreen cases={filteredCases} onOpen={setOpenCaseId} />
              )
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
