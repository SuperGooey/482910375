import type { CSSProperties } from "react";
import { ink } from "./colors";

export const hairline: CSSProperties = { border: `0.5px solid ${ink(0.16)}` };

// native-style translucent bar: frosted, saturated, fades to transparent at the
// edge that meets scrolling content instead of a hard divider line
const FROSTED_BG = "rgba(246,247,251,0.94)";
const FROSTED_FILTER = "blur(20px) saturate(120%)";

export function frostedStyle(direction: "down" | "up"): CSSProperties {
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
  } as CSSProperties;
}
