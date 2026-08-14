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
