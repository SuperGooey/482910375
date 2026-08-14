import type { ElementType, MouseEventHandler, ReactNode } from "react";
import { CARD_SHADOW, COLORS } from "../../theme/colors";
import { SquircleCard } from "../primitives/SquircleCard";
import { MiniMap, type MiniMapMode } from "./MiniMap";
import type { LatLng } from "../../types";

// shared shell for every card-list item in the app (Queue, Cases, Missed,
// Completed) — the Squircle sizing/shadow/border, the map background, and
// the two gradient overlays are identical everywhere; only the content
// overlaid on top (passed as children) actually differs between them.
// `active` is only meaningful in the desktop split-pane layout, where a
// card stays visible in the list alongside its own docked detail panel —
// on mobile nothing ever renders a card and its detail at the same time,
// so no card has needed a "this one's open" look until now.
export function MapCard({
  as = "div",
  onClick,
  height = "h-28",
  seed,
  distancePct = 20,
  mapMode = "live",
  dim = false,
  latlng,
  topGradient = "via-white/80",
  bottomGradient = "from-white/70",
  active = false,
  children,
}: {
  as?: ElementType;
  onClick?: MouseEventHandler<HTMLElement>;
  height?: string;
  seed: number;
  distancePct?: number;
  mapMode?: MiniMapMode;
  dim?: boolean;
  latlng?: LatLng;
  topGradient?: string;
  bottomGradient?: string;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <SquircleCard
      as={as}
      radius={18}
      onClick={onClick}
      className={`relative text-left ${height} overflow-hidden w-full ${onClick ? "active:scale-[0.99] transition-all" : ""}`}
      shadow={CARD_SHADOW}
      borderColor={active ? COLORS.accent : undefined}
      borderWidth={active ? 2 : undefined}
    >
      <MiniMap seed={seed} distancePct={distancePct} mode={mapMode} dim={dim} latlng={latlng} />
      <div className={`absolute inset-0 bg-gradient-to-t from-white ${topGradient} to-transparent`} />
      <div className={`absolute inset-0 bg-gradient-to-b ${bottomGradient} to-transparent`} />
      {children}
    </SquircleCard>
  );
}
