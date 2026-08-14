import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Navigation } from "lucide-react";
import { COLORS, matchColors } from "../../theme/colors";
import { CALLER_LATLNG } from "../../data/mockData";
import { loadLeaflet, MAP_RESIZE_SETTLE_DELAY_MS } from "../../lib/leaflet";
import type { CallUnit } from "../../types";
import { Pill } from "../primitives/Pill";
import { AbstractMap } from "./AbstractMap";

type StreetMapStatus = "loading" | "fallback" | "ready";

// ---------------- Street map ----------------
export function StreetMap({ ranked, height = "100%" }: { ranked: CallUnit[]; height?: string | number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const [status, setStatus] = useState<StreetMapStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    function initMap(L: typeof Leaflet) {
      if (cancelled || !containerRef.current || mapRef.current) return;
      try {
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: false,
        }).setView(CALLER_LATLNG, 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        const tilePane = containerRef.current.querySelector<HTMLElement>(".leaflet-tile-pane");
        if (tilePane) tilePane.style.filter = "saturate(0.42) brightness(1.18) contrast(0.85)";
        const callerIcon = L.divIcon({
          className: "",
          html: `<div style="position:relative;width:16px;height:16px;">
                   <div style="position:absolute;inset:-8px;border-radius:9999px;background:#3B5BDB33;animation:pulseRing 1.8s ease-out infinite;"></div>
                   <div style="position:relative;width:16px;height:16px;border-radius:9999px;background:#3B5BDB;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);"></div>
                 </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker(CALLER_LATLNG, { icon: callerIcon }).addTo(map);
        ranked.forEach((u) => {
          const c = matchColors(u.match);
          const icon = L.divIcon({
            className: "",
            html: `<div style="width:13px;height:13px;border-radius:9999px;background:${c.dot};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);opacity:${
              u.match < 45 ? 0.5 : 1
            };"></div>`,
            iconSize: [13, 13],
            iconAnchor: [6, 6],
          });
          L.marker([u.lat, u.lng], { icon }).addTo(map);
        });
        mapRef.current = map;
        setStatus("ready");
        setTimeout(() => map.invalidateSize(), MAP_RESIZE_SETTLE_DELAY_MS);
      } catch {
        setStatus("fallback");
      }
    }
    loadLeaflet()
      .then((L) => !cancelled && initMap(L))
      .catch(() => !cancelled && setStatus("fallback"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "fallback") return <AbstractMap ranked={ranked} />;

  return (
    <div className="relative w-full isolate" style={{ height }}>
      <style>{`@keyframes pulseRing{0%{transform:scale(0.6);opacity:0.6}100%{transform:scale(1.8);opacity:0}}`}</style>
      <div ref={containerRef} className="w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: COLORS.page }}>
          <div className="w-5 h-5 rounded-full border-2 border-[#3B5BDB] border-t-transparent animate-spin" />
        </div>
      )}
      <div className="absolute top-3 left-3 pointer-events-none">
        <Pill className="bg-white/90 text-[#454B5C] shadow-sm">
          <Navigation size={11} /> Nearby
        </Pill>
      </div>
    </div>
  );
}
