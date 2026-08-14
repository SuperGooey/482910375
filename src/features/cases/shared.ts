import { COLORS } from "../../theme/colors";
import type { CaseStatus } from "../../types";
import type { MiniMapMode } from "../../components/map/MiniMap";

export const statusStyle: Record<CaseStatus, { label: string; bg: string; fg: string }> = {
  en_route: { label: "En route", bg: "#EEF1FD", fg: COLORS.accent },
  on_scene: { label: "On scene", bg: COLORS.warningBg, fg: COLORS.warning },
  resolved: { label: "Resolved", bg: COLORS.successBg, fg: COLORS.success },
  scheduled: { label: "Scheduled", bg: "#F1EEFD", fg: "#7C5CE0" },
};

export const caseMapMode: Record<CaseStatus, MiniMapMode> = {
  en_route: "live",
  on_scene: "static",
  resolved: "static",
  scheduled: "siteOnly",
};
