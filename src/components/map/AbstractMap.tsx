import { COLORS, matchColors } from "../../theme/colors";
import type { CallUnit } from "../../types";

export function AbstractMap({ ranked }: { ranked: CallUnit[] }) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#F7FBF6]">
      <div className="absolute" style={{ left: "46%", top: "48%" }}>
        <span className="absolute -inset-3 rounded-full animate-ping" style={{ backgroundColor: "rgba(59,91,219,0.2)" }} />
        <span className="relative block w-3.5 h-3.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: COLORS.accent }} />
      </div>
      {ranked.map((u, i) => {
        const c = matchColors(u.match);
        const x = 20 + ((i * 37) % 60);
        const y = 20 + ((i * 53) % 60);
        return (
          <div
            key={u.id}
            className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow"
            style={{ left: `${x}%`, top: `${y}%`, background: c.dot, opacity: u.match < 45 ? 0.45 : 1 }}
          />
        );
      })}
    </div>
  );
}
