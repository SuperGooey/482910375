import { ClipboardList, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COLORS } from "../theme/colors";
import type { Tab } from "./types";

const NAV_ITEMS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "queue", label: "Queue", icon: Phone },
  { key: "cases", label: "Jobs", icon: ClipboardList },
];

// desktop's left nav rail, replacing the mobile bottom tab bar
export function Sidebar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      aria-label="Primary"
      className="w-24 shrink-0 h-full flex flex-col items-center gap-1.5 pt-6 border-r border-[#ECEEF5]"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            aria-current={active ? "page" : undefined}
            className={`w-16 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-colors ${
              active ? "" : "text-[#9AA0B0] hover:text-[#454B5C]"
            }`}
            style={active ? { backgroundColor: "rgba(59,91,219,0.08)", color: COLORS.accent } : undefined}
          >
            <Icon size={18} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
