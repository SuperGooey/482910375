export type LatLng = [number, number];

export type Urgency = "high" | "medium" | "low";

export interface Contact {
  name: string;
  matchConfidence: number;
  matchSource: string;
  notes?: string[];
}

export interface ContextItem {
  label: string;
  detail: string;
}

export type ScriptPhase = "triage" | "customer" | "scheduling";

export interface ScriptLine {
  who: "caller" | "ai";
  phase: ScriptPhase;
  text: string;
}

export interface CallUnit {
  id: string;
  eta: number | null;
  match: number;
  tag: string;
  lat: number;
  lng: number;
  scheduledTime?: string;
}

export type CallDispatchMode = "dispatch" | "schedule";
export type CallStage = "triaging" | "dispatching" | "dispatched";

export interface Call {
  id: string;
  location: string;
  situation: string;
  urgency: Urgency;
  confidence: number;
  startSeconds: number;
  flag: "gas" | null;
  mode: CallDispatchMode;
  resultCaseId: string;
  stage: CallStage;
  latlng: LatLng;
  contact?: Contact;
  confirmedName?: string;
  banner?: { title: string; body: string };
  contextItems?: ContextItem[];
  script: ScriptLine[];
  units: CallUnit[];
}

export type CaseStatus = "en_route" | "on_scene" | "resolved" | "scheduled";

export interface CaseRecord {
  id: string;
  unit: string;
  location: string;
  /** Stable slug identifying the physical address (kebab-case, derived from `location`), independent of the human-readable string — used to key into property-level records like service history. */
  propertyId: string;
  status: CaseStatus;
  meta?: string;
  latlng: LatLng;
  contact?: Contact | null;
  contextItems?: ContextItem[];
  cost?: number;
  note?: string;
  followUp?: boolean;
  followUpNote?: string;
  date?: string;
  time?: string;
  durationMin?: number;
}

// One past-visit record at a property, shown in the case detail's service
// history timeline (date, technician, what was done, and the cost).
export interface ServiceHistoryEntry {
  id: string;
  /** ISO date (YYYY-MM-DD), always before "today" in the app's simulated clock. */
  date: string;
  /** Same "Tech · First Initial. Last Name" format as CaseRecord.unit / CallUnit.id, so it's compatible with initials() as-is. */
  techUnit: string;
  jobType: "Water Heater" | "HVAC" | "Plumbing" | "Electrical" | "Gas";
  summary: string;
  cost: number;
}

export type WarrantyStatus = "active" | "expired" | "unknown";

// A piece of equipment on file at a property (make/model, install date,
// warranty), surfaced in the case detail's pre-visit briefing so a
// dispatcher knows what's already installed before a technician arrives.
// Property-level like ServiceHistoryEntry — equipment persists across
// visits/cases at the same address, independent of any single call/case.
export interface EquipmentInfo {
  id: string;
  /** Descriptive equipment type, e.g. "Water Heater", "Central AC", "Furnace", "Kitchen Faucet" — more specific than ServiceHistoryEntry.jobType's broader job categories. */
  type: string;
  make: string;
  model: string;
  /** ISO date (YYYY-MM-DD) the unit was installed, if known. */
  installDate?: string;
  warrantyStatus: WarrantyStatus;
  /** ISO date (YYYY-MM-DD) the warranty expires/expired, if known. */
  warrantyExpiration?: string;
  /**
   * Whether a manual/parts-order affordance should be offered for this
   * unit. Deliberately booleans rather than href/URL fields — there's no
   * real manual or parts catalog behind this demo data, so a future UI
   * should treat these as "show the button" flags and wire up an actual
   * destination later rather than link out anywhere now.
   */
  manualAvailable?: boolean;
  partsAvailable?: boolean;
}

export interface MissedCall {
  id: string;
  location: string;
  situation: string;
  missedAt: string;
  reason: string;
  latlng: LatLng;
  contact: Contact | null;
}

export type CompletedCallStatus = "scheduled" | "resolved" | "callback";

export interface CompletedCall {
  id: string;
  location: string;
  situation: string;
  status: CompletedCallStatus;
  completedAt: string;
  duration: string;
  outcome: string;
  latlng: LatLng;
  contact: Contact | null;
}
