import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { COLORS } from "../../theme/colors";
import { polarPos } from "../../lib/geo";
import { loadLeaflet, MAP_RESIZE_SETTLE_DELAY_MS } from "../../lib/leaflet";
import type { LatLng } from "../../types";

type MiniMapMode = "live" | "static" | "siteOnly";
type MiniMapStatus = "loading" | "fallback" | "ready";

// A small, non-interactive real map used as a card background — same tiles and
// loading path as the big map in call detail, just tiny and frozen in place
// (no drag/zoom handlers) so many of these on screen at once stay cheap.
// mode: "live" (unit en route, dashed line + moving dot), "static" (unit essentially
// on-site), "siteOnly" (no unit dot yet — e.g. a scheduled appointment)
export function MiniMap({
  seed,
  distancePct = 26,
  mode = "live",
  dim = false,
  latlng,
}: {
  seed: number;
  distancePct?: number;
  mode?: MiniMapMode;
  dim?: boolean;
  latlng?: LatLng;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const [status, setStatus] = useState<MiniMapStatus>(latlng ? "loading" : "fallback");
  const pos = polarPos(seed, distancePct);

  useEffect(() => {
    if (!latlng) return;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        // `tap` predates @types/leaflet's MapOptions (it's a legacy touch-tap
        // toggle Leaflet still accepts at runtime) — widen the type rather
        // than drop the option.
        const mapOptions: Leaflet.MapOptions & { tap?: boolean } = {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
          tap: false,
        };
        const map = L.map(containerRef.current, mapOptions).setView(latlng, 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        const tilePane = containerRef.current.querySelector<HTMLElement>(".leaflet-tile-pane");
        if (tilePane) tilePane.style.filter = "saturate(0.4) brightness(1.22) contrast(0.82)";
        mapRef.current = map;
        setStatus("ready");
        setTimeout(() => map.invalidateSize(), MAP_RESIZE_SETTLE_DELAY_MS);
      })
      .catch(() => !cancelled && setStatus("fallback"));
    return () => {
      cancelled = true;
    };
  }, [latlng]);

  return (
    <div className={`absolute inset-0 overflow-hidden isolate ${dim ? "grayscale opacity-60" : ""}`}>
      {status !== "fallback" ? (
        <>
          <div ref={containerRef} className="absolute inset-0 bg-[#EEF2FF]" />
          <div className="absolute inset-0 bg-white/55 pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#EEF2FF] to-[#F7FBF6]" />
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,40 C30,45 60,20 100,30" stroke="#C7CEEB" strokeWidth="1.2" fill="none" />
            <path d="M0,70 C40,65 60,85 100,75" stroke="#C7CEEB" strokeWidth="1.2" fill="none" />
            <path d="M25,0 C30,40 20,70 30,100" stroke="#C7CEEB" strokeWidth="1.2" fill="none" />
          </svg>
        </>
      )}
      {mode === "live" && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="50" y1="50" x2={pos.x} y2={pos.y} stroke={COLORS.accent} strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
        </svg>
      )}
      <div
        className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow"
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", backgroundColor: COLORS.accent }}
      />
      {mode !== "siteOnly" && (
        <div
          className="absolute w-2 h-2 rounded-full bg-[#3FBE86] border-2 border-white shadow"
          style={{
            left: `${mode === "static" ? 55 : pos.x}%`,
            top: `${mode === "static" ? 52 : pos.y}%`,
            transform: "translate(-50%,-50%)",
          }}
        />
      )}
    </div>
  );
}

export type { MiniMapMode };
