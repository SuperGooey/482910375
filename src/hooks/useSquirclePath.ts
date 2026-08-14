import { useEffect, useRef, useState, type RefObject } from "react";

export type SquircleRadius = number | [number, number, number, number];

// ---- real squircle corners, computed in JS ----
// corner-shape:squircle isn't supported in Safari yet, but the curve itself is
// just a superellipse — given an element's measured size and a target radius,
// we can compute the exact clip path ourselves and it works everywhere today.
export function useSquirclePath(
  radius: SquircleRadius,
  n = 5,
  steps = 10
): [RefObject<HTMLElement | null>, string | null] {
  const ref = useRef<HTMLElement | null>(null);
  const [clipPath, setClipPath] = useState<string | null>(null);
  const radiusKey = Array.isArray(radius) ? radius.join(",") : radius;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const [rtl, rtr, rbr, rbl] = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
      const clamp = (r: number) => Math.min(r, w / 2, h / 2);
      const rTL = clamp(rtl);
      const rTR = clamp(rtr);
      const rBR = clamp(rbr);
      const rBL = clamp(rbl);

      const corner = (cx: number, cy: number, r: number, startAngle: number) => {
        const pts: string[] = [];
        for (let i = 0; i <= steps; i++) {
          const t = startAngle + (Math.PI / 2) * (i / steps);
          const cosT = Math.cos(t);
          const sinT = Math.sin(t);
          const x = cx + Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n) * r;
          const y = cy + Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n) * r;
          pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        return pts;
      };

      // clockwise from the left edge of the top-left corner
      const pts = [
        ...corner(rTL, rTL, rTL, Math.PI),
        ...corner(w - rTR, rTR, rTR, -Math.PI / 2),
        ...corner(w - rBR, h - rBR, rBR, 0),
        ...corner(rBL, h - rBL, rBL, Math.PI / 2),
      ];
      setClipPath(`path("M ${pts.join(" L ")} Z")`);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKey, n, steps]);

  return [ref, clipPath];
}
