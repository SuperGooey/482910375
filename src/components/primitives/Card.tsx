import type { ReactNode } from "react";
import { CARD_SHADOW } from "../../theme/colors";
import { SquircleCard } from "./SquircleCard";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <SquircleCard radius={24} className={`bg-white p-5 ${className}`} shadow={CARD_SHADOW}>
      {children}
    </SquircleCard>
  );
}
