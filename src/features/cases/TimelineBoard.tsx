import { useEffect, useRef, useState } from "react";
import { COLORS, ink } from "../../theme/colors";
import { DAY_SPAN, WEEK_DAYS, WEEK_SPAN, initials, visibleMinutesForZoom, weekMinutesFor } from "../../lib/schedule";
import { SquircleCard } from "../../components/primitives/SquircleCard";
import { Squircle } from "../../components/primitives/Squircle";
import type { CaseRecord } from "../../types";
import { ZoomSlider } from "./ZoomSlider";

interface RowMarker {
  side: "left" | "right";
  top: number;
}

// technician tracks with jobs placed as clips along a shared time axis — the
// mobile-friendly analog of a video editor's timeline, so every tech's
// availability for the day is visible at once instead of one at a time
export function TimelineBoard({
  technicians,
  jobs,
  onOpen,
  focusDate,
}: {
  technicians: string[];
  jobs: CaseRecord[];
  onOpen: (id: string) => void;
  focusDate?: string;
}) {
  const [zoom, setZoom] = useState(0.46); // default to roughly a day's worth visible
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportW, setViewportW] = useState(280);
  const [scrollLeft, setScrollLeft] = useState(0);
  const AVATAR_COL = 52;
  const RULER_H = 24;
  const ROW_H = 58;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportW(el.offsetWidth - AVATAR_COL));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleMinutes = visibleMinutesForZoom(zoom);
  const pxPerMin = viewportW / visibleMinutes;
  const trackWidth = WEEK_SPAN * pxPerMin;
  const showHourLabels = pxPerMin * 60 > 26; // only legible once zoomed in enough
  const canScrollLeft = scrollLeft > 4;
  const canScrollRight = scrollLeft + viewportW < trackWidth - 4;

  // scroll the board so the focused day is in view whenever it (or the zoom
  // level, which changes how much fits on screen) changes
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !focusDate) return;
    const dayIdx = WEEK_DAYS.indexOf(focusDate);
    if (dayIdx === -1) return;
    el.scrollTo({ left: Math.max(0, dayIdx * DAY_SPAN * pxPerMin - 12), behavior: "smooth" });
  }, [focusDate, pxPerMin]);

  // per-row: is any of this tech's jobs entirely outside the current visible
  // window? computed here (not nested inside the scrolling track) so it's a
  // simple list of {top, side} markers we can render as fixed overlays —
  // sticky elements buried several levels deep inside a horizontally
  // scrolling structure are fragile across browsers, plain position math isn't
  const rowMarkers: RowMarker[] = technicians.flatMap((tech, rowIdx) => {
    const positions = jobs
      .filter((j) => j.unit === tech)
      .map((j) => {
        const startMin = weekMinutesFor(j.date, j.time);
        if (startMin == null) return null;
        const left = startMin * pxPerMin;
        const width = Math.max((j.durationMin || 60) * pxPerMin, 6);
        return { left, right: left + width };
      })
      .filter((p): p is { left: number; right: number } => p !== null);
    const top = RULER_H + rowIdx * ROW_H + ROW_H / 2;
    const marks: RowMarker[] = [];
    if (positions.some((p) => p.right < scrollLeft)) marks.push({ side: "left", top });
    if (positions.some((p) => p.left > scrollLeft + viewportW)) marks.push({ side: "right", top });
    return marks;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-0.5 w-full">
        <span className="text-[11px] text-[#9AA0B0] shrink-0">Week</span>
        <ZoomSlider value={zoom} onChange={setZoom} />
        <span className="text-[11px] text-[#9AA0B0] shrink-0">Hour</span>
      </div>

      <SquircleCard as="div" radius={18} className="relative overflow-hidden bg-white">
        <div
          ref={viewportRef}
          className="overflow-x-auto"
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div style={{ width: trackWidth + AVATAR_COL }}>
            {/* ruler: day dividers always shown, hour ticks only once legible */}
            <div className="flex sticky top-0 z-10 bg-white border-b border-[#ECEEF5]">
              <div
                className="shrink-0 sticky left-0 z-20 bg-white"
                style={{ width: AVATAR_COL, borderRight: `1px solid ${ink(0.1)}` }}
              />
              <div className="relative" style={{ width: trackWidth, height: RULER_H }}>
                {WEEK_DAYS.map((iso, i) => {
                  const d = new Date(`${iso}T00:00:00`);
                  const left = i * DAY_SPAN * pxPerMin;
                  return (
                    <div key={iso} className="absolute top-0 bottom-0 border-l border-[#ECEEF5]" style={{ left }}>
                      <span className="absolute top-0.5 left-1.5 text-[9px] font-semibold text-[#454B5C] whitespace-nowrap">
                        {d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}
                      </span>
                    </div>
                  );
                })}
                {showHourLabels &&
                  WEEK_DAYS.map((iso, i) =>
                    Array.from({ length: DAY_SPAN / 60 + 1 }).map((_, h) => {
                      const hour = 8 + h;
                      const left = (i * DAY_SPAN + h * 60) * pxPerMin;
                      return (
                        <div
                          key={`${iso}-${hour}`}
                          className="absolute bottom-0.5 text-[8px] text-[#9AA0B0]"
                          style={{ left: left + 2 }}
                        >
                          {hour > 12 ? hour - 12 : hour}
                          {hour >= 12 ? "p" : "a"}
                        </div>
                      );
                    })
                  )}
              </div>
            </div>

            {/* technician tracks */}
            {technicians.map((tech) => {
              const techJobs = jobs.filter((j) => j.unit === tech);
              return (
                <div key={tech} className="flex border-b border-[#ECEEF5] last:border-b-0">
                  <div
                    className="shrink-0 sticky left-0 z-10 bg-white flex items-center justify-center py-3"
                    style={{ width: AVATAR_COL, height: ROW_H, borderRight: `1px solid ${ink(0.1)}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      {initials(tech)}
                    </div>
                  </div>
                  <div className="relative" style={{ width: trackWidth, height: ROW_H }}>
                    {WEEK_DAYS.map((iso, i) => (
                      <div
                        key={iso}
                        className="absolute top-0 bottom-0 border-l border-[#F1F2F8]"
                        style={{ left: i * DAY_SPAN * pxPerMin }}
                      />
                    ))}
                    {techJobs.map((j) => {
                      const startMin = weekMinutesFor(j.date, j.time);
                      if (startMin == null) return null;
                      const dur = j.durationMin || 60;
                      const left = startMin * pxPerMin;
                      const width = Math.max(dur * pxPerMin, 6);
                      const wide = width > 60;
                      return (
                        <Squircle
                          as="button"
                          radius={8}
                          key={j.id}
                          onClick={() => onOpen(j.id)}
                          className="absolute top-2.5 text-left overflow-hidden active:scale-95 transition-all"
                          style={{
                            left,
                            width,
                            height: 38,
                            backgroundColor: COLORS.accent,
                            color: "#FFFFFF",
                            padding: wide ? "4px 8px" : "2px",
                          }}
                        >
                          {wide ? (
                            <>
                              <div className="text-[10px] font-semibold truncate">{j.time}</div>
                              <div className="text-[9px] truncate opacity-90">{j.location}</div>
                            </>
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </Squircle>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* fade where the sticky avatar column meets the scrolling tracks —
            strengthens into a "more to scroll" fade when there's content that way */}
        {canScrollLeft && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: AVATAR_COL, width: 18, background: "linear-gradient(to right, #FFFFFF, transparent)" }}
          />
        )}
        {canScrollRight && (
          <div
            className="absolute top-0 bottom-0 right-0 pointer-events-none"
            style={{ width: 18, background: "linear-gradient(to left, #FFFFFF, transparent)" }}
          />
        )}

        {/* "there's a job that way, off-screen" markers — plain fixed overlays
            positioned by row index, sitting outside the scrolling structure
            entirely so they don't depend on nested sticky behavior */}
        {rowMarkers.map((m, i) => (
          <div
            key={i}
            className="absolute w-1 h-5 rounded-full pointer-events-none"
            style={{
              [m.side]: m.side === "left" ? AVATAR_COL + 3 : 3,
              top: m.top - 10,
              backgroundColor: COLORS.accent,
              opacity: 0.6,
              zIndex: 20,
            }}
          />
        ))}
      </SquircleCard>
    </div>
  );
}
