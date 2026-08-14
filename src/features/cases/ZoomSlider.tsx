import { useRef } from "react";
import { COLORS, ink } from "../../theme/colors";

const ZOOM_TICKS = [0, 0.46, 1]; // week / ~one day / one hour — reference marks only

export function ZoomSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={() => onChange(Math.max(0, value - 0.1))}
        aria-label="Zoom out (show more time)"
        className="w-7 h-7 rounded-full bg-[#F1F2F8] flex items-center justify-center text-[#454B5C] text-[14px] font-bold active:scale-95 transition-all shrink-0"
      >
        –
      </button>
      <div ref={trackRef} className="relative flex-1 h-6 flex items-center">
        <div className="absolute left-0 right-0 h-1 rounded-full" style={{ backgroundColor: ink(0.14) }} />
        <div
          className="absolute left-0 h-1 rounded-full"
          style={{ width: `${value * 100}%`, backgroundColor: COLORS.accent }}
        />
        {ZOOM_TICKS.map((t) => (
          <div
            key={t}
            className="absolute w-[3px] h-[3px] rounded-full pointer-events-none"
            style={{
              left: `${t * 100}%`,
              transform: "translateX(-50%)",
              backgroundColor: t <= value ? "rgba(255,255,255,0.8)" : "#C7CEEB",
            }}
          />
        ))}
        <input
          type="range"
          min={0}
          max={100}
          value={value * 100}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label="Timeline zoom level"
          aria-valuetext={value < 0.2 ? "Full week visible" : value > 0.8 ? "One hour visible" : "Partial day visible"}
          className="absolute inset-0 w-full appearance-none bg-transparent"
          style={{ opacity: 0, cursor: "pointer", touchAction: "pan-x" }}
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-white pointer-events-none"
          style={{
            left: `calc(${value * 100}% - 8px)`,
            border: `1px solid ${ink(0.16)}`,
            boxShadow: `0 1px 3px ${ink(0.2)}`,
          }}
        />
      </div>
      <button
        onClick={() => onChange(Math.min(1, value + 0.1))}
        aria-label="Zoom in (show more detail)"
        className="w-7 h-7 rounded-full bg-[#F1F2F8] flex items-center justify-center text-[#454B5C] text-[14px] font-bold active:scale-95 transition-all shrink-0"
      >
        +
      </button>
    </div>
  );
}
