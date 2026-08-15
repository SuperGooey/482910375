import type { CSSProperties } from "react";
import { ink } from "./colors";

export const hairline: CSSProperties = { border: `0.5px solid ${ink(0.16)}` };

// native-style translucent bar: frosted, saturated, fades to transparent at the
// edge that meets scrolling content instead of a hard divider line
const FROSTED_FILTER = "blur(20px) saturate(120%)";

// page background (#F6F7FB) as an r,g,b triplet — the default base color,
// used everywhere this sits directly on the page. The desktop detail panel
// sits on a white card instead, so it passes "255,255,255" to match that
// instead of showing a page-colored seam against the card.
const PAGE_RGB = "246,247,251";

export function frostedStyle(direction: "down" | "up", baseRgb: string = PAGE_RGB): CSSProperties {
  const gradient =
    direction === "down"
      ? "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)"
      : "linear-gradient(to top, black 0%, black 65%, transparent 100%)";
  return {
    backgroundColor: `rgba(${baseRgb},0.94)`,
    backdropFilter: FROSTED_FILTER,
    WebkitBackdropFilter: FROSTED_FILTER,
    maskImage: gradient,
    WebkitMaskImage: gradient,
  } as CSSProperties;
}
