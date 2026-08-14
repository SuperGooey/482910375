import type { ElementType, HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { useSquirclePath, type SquircleRadius } from "../../hooks/useSquirclePath";
import { COLORS } from "../../theme/colors";

interface SquircleCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  radius?: SquircleRadius;
  borderColor?: string;
  shadow?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
}

// for cards that need BOTH a true squircle curve AND a shadow. Putting a
// blurred shadow and a precise clip-path on the same element is what caused
// the corner mismatch we chased for a while — box-shadow/filter and
// clip-path don't reliably composite together at the pixel level. The fix is
// to never let them compete: the shadow lives on an outer, unclipped
// wrapper with an ordinary (circular-arc) border-radius — good enough,
// since blur erases the difference between that and a true squircle curve
// at any shadow strength we actually use — while the inner element does the
// real, precise squircle clip and border, with nothing else on it.
export function SquircleCard({
  as: Tag = "div",
  radius = 20,
  className = "",
  borderColor = COLORS.border,
  shadow,
  onClick,
  children,
  ...rest
}: SquircleCardProps) {
  const [ref, clipPath] = useSquirclePath(radius);
  const borderRadius = Array.isArray(radius) ? radius.map((r) => `${r}px`).join(" ") : radius;
  return (
    <div style={{ borderRadius, boxShadow: shadow }}>
      <Tag
        ref={ref}
        onClick={onClick}
        className={`relative ${className}`}
        style={{ borderRadius, clipPath: clipPath || undefined }}
        {...rest}
      >
        {children}
        {/* the border lives on its own overlay, painted after (so on top
            of) everything else in the card — otherwise opaque children
            like a full-bleed map paint over an inset box-shadow border,
            since that's a background-layer effect that sits behind
            normal child content */}
        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius, boxShadow: `inset 0 0 0 1px ${borderColor}` }} />
      </Tag>
    </div>
  );
}
