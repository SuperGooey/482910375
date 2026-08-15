// centralizes the colors driven by inline `style` props — the majority of
// this app's dynamic/computed styling, since we moved color logic to inline
// styles early on after finding Tailwind's arbitrary-value classes (e.g.
// bg-[#3B5BDB]) unreliable for some dynamic cases. Tailwind's className
// utilities can't reference these tokens directly without a Tailwind config
// file, which isn't available in this single-file setup, so a handful of
// static className color usages remain outside this system — a real, known
// gap rather than an oversight. Defined first, before anything else in the
// file, since several top-level consts below reference these immediately.
export const COLORS = {
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
} as const;

// a translucent shade of the base ink color, for borders/tracks/dividers at
// varying opacity — replaces the many one-off rgba(30,34,51,X) literals
export function ink(alpha: number): string {
  return `rgba(30,34,51,${alpha})`;
}

// the standard resting elevation used by every card in the app
export const CARD_SHADOW = `0 1px 2px ${ink(0.03)}, 0 6px 18px ${ink(0.04)}`;

// for dark text sitting directly on photo/map imagery (no card behind it),
// where a plain drop shadow alone isn't reliable. This app's map tiles are
// deliberately desaturated/brightened (see MiniMap's tile-pane filter), so
// a *blurred* white glow has almost nothing to push against — it reads as
// basically invisible on most of this app's maps. A crisp white edge does
// the job reliably regardless of how light the map underneath is: eight
// zero-blur white shadows, one in each direction, approximate a thin even
// stroke around the glyph (the classic "poor man's text-stroke" — plain
// text-shadow, so it works everywhere -webkit-text-stroke might not). Kept
// just under full opacity, and paired with a soft dark shadow on top for
// depth against lighter patches, so it still reads as lifted text rather
// than a flat cartoon outline.
export const PHOTO_TEXT_SHADOW = [
  "1.5px 0 0 rgba(255,255,255,0.95)",
  "-1.5px 0 0 rgba(255,255,255,0.95)",
  "0 1.5px 0 rgba(255,255,255,0.95)",
  "0 -1.5px 0 rgba(255,255,255,0.95)",
  "1px 1px 0 rgba(255,255,255,0.95)",
  "-1px -1px 0 rgba(255,255,255,0.95)",
  "1px -1px 0 rgba(255,255,255,0.95)",
  "-1px 1px 0 rgba(255,255,255,0.95)",
  "0 1px 3px rgba(0,0,0,0.3)",
  "0 2px 10px rgba(0,0,0,0.18)",
].join(", ");

export const urgencyDot: Record<"high" | "medium" | "low", string> = {
  high: COLORS.danger,
  medium: "#F0B94D",
  low: "#3FBE86",
};

export function matchColors(match: number): { fg: string; dot: string } {
  if (match >= 85) return { fg: COLORS.success, dot: "#3FBE86" };
  if (match >= 60) return { fg: COLORS.warning, dot: "#F0B94D" };
  return { fg: COLORS.danger, dot: "#F08782" };
}
