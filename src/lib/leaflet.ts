import type * as L from "leaflet";

declare global {
  interface Window {
    L?: typeof L;
  }
}

// Leaflet is measured by the map itself right on mount, before our own
// layout/animation has necessarily settled — a short delay lets it
// re-measure so tiles render at the right size instead of clipped/offset
export const MAP_RESIZE_SETTLE_DELAY_MS = 150;

// Leaflet is loaded once and shared by every map on screen (the big interactive
// map and every small card map) so we never inject duplicate script tags and
// every map goes through the same, already-proven loading path.
let leafletLoadPromise: Promise<typeof L> | null = null;

export function loadLeaflet(): Promise<typeof L> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;
  leafletLoadPromise = new Promise((resolve, reject) => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    const scriptId = "leaflet-js";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L!));
      existing.addEventListener("error", () => reject(new Error("leaflet failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.async = true;
    script.onload = () => resolve(window.L!);
    script.onerror = () => reject(new Error("leaflet failed to load"));
    document.body.appendChild(script);
  });
  return leafletLoadPromise;
}
