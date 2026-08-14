import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { useSquirclePath, type SquircleRadius } from "../../hooks/useSquirclePath";

interface SquircleProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  radius?: SquircleRadius;
  children?: ReactNode;
}

// drop-in wrapper: renders as any tag, clips to a true squircle once measured,
// falls back to a plain rounded corner (via borderRadius) until then.
// radius can be a single number, or [topLeft, topRight, bottomRight, bottomLeft]
export function Squircle({ as: Tag = "div", radius = 20, className = "", style, children, ...rest }: SquircleProps) {
  const [ref, clipPath] = useSquirclePath(radius);
  const borderRadius = Array.isArray(radius) ? radius.map((r) => `${r}px`).join(" ") : radius;
  return (
    <Tag ref={ref} className={className} style={{ ...style, borderRadius, clipPath: clipPath || undefined }} {...rest}>
      {children}
    </Tag>
  );
}
