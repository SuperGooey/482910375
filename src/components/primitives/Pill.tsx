import type { CSSProperties, ReactNode } from "react";
import { hairline } from "../../theme/styles";

export function Pill({
  children,
  className = "",
  style,
  size = 11,
  weight = 500,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  size?: number;
  weight?: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${className}`}
      style={{ fontSize: size, fontWeight: weight, ...hairline, ...style }}
    >
      {children}
    </span>
  );
}
