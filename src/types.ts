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
