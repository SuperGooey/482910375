import type { ElementType, MouseEventHandler, ReactNode } from "react";
import { CARD_SHADOW } from "../../theme/colors";
import { SquircleCard } from "../primitives/SquircleCard";
import { MiniMap, type MiniMapMode } from "./MiniMap";
import type { LatLng } from "../../types";

// shared shell for every card-list item in the app (Queue, Cases, Missed,
// Completed) — the Squircle sizing/shadow/border, the map background, and
// the two gradient overlays are identical everywhere; only the content
// overlaid on top (passed as children) actually differs between them
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
  children?: ReactNode;
}) {
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
