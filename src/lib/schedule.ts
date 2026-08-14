import { hashSeed } from "./geo";

export function initials(techName: string): string {
  const parts = techName.replace("Tech · ", "").split(" ").filter(Boolean);
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function parseTimeToMinutes(t: string): number {
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
export const WEEK_START = "2026-08-12";
export const WEEK_DAYS: string[] = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(`${WEEK_START}T00:00:00`);
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});
export const DAY_START_MIN = 8 * 60; // business hours 8:00
export const DAY_END_MIN = 18 * 60; // through 18:00
export const DAY_SPAN = DAY_END_MIN - DAY_START_MIN; // 600 minutes/day
export const WEEK_SPAN = DAY_SPAN * WEEK_DAYS.length; // total minutes across the week

// zoom 0 = the whole week fits the canvas, zoom 1 = a single hour fills it.
// Exponential rather than linear interpolation, since "how much time is
// visible" is the kind of range that feels even across a slider on a log
// scale (like a map), not a linear one.
export function visibleMinutesForZoom(zoom: number): number {
  return WEEK_SPAN * Math.pow(60 / WEEK_SPAN, zoom);
}

export function weekMinutesFor(dateIso: string | undefined, timeStr: string | undefined): number | null {
  if (dateIso == null || timeStr == null) return null;
  const dayIdx = WEEK_DAYS.indexOf(dateIso);
  if (dayIdx === -1) return null;
  const tMin = Math.max(0, Math.min(DAY_SPAN, parseTimeToMinutes(timeStr) - DAY_START_MIN));
  return dayIdx * DAY_SPAN + tMin;
}

export function unitSchedule(id: string): boolean[] {
  const seed = hashSeed(id);
  return Array.from({ length: 8 }).map((_, i) => ((seed >> i) & 1) === 0);
}

export function nextFreeLabel(slots: boolean[]): string {
  const idx = slots.findIndex(Boolean);
  if (idx === 0) return "Free now";
  if (idx === -1) return "Busy today";
  const totalMin = idx * 30;
  const h = 14 + Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `Free at ${h12}:${String(m).padStart(2, "0")} ${period}`;
}
