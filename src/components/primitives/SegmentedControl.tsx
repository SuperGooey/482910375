import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { COLORS, ink } from "../../theme/colors";

export interface SegmentedControlOption<K extends string> {
  key: K;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<K extends string> {
  options: SegmentedControlOption<K>[];
  value: K;
  onChange: (key: K) => void;
  variant?: "track" | "solid";
  stretch?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

// one shared segmented control for the whole app — variant="track" is the
// native-style light track with a white active segment (used for navigation:
// Team/Call/Context, Live/Missed/History, In progress/Scheduled/Resolved);
// variant="solid" is a white track with a solid accent-filled active segment
// (used for the AI Dispatch / Manual takeover mode switch). stretch controls
// whether segments fill the available width or just size to their label.
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  variant = "track",
  stretch = true,
  disabled = false,
  ariaLabel,
}: SegmentedControlProps<K>) {
  const trackStyle: CSSProperties =
    variant === "track"
      ? { backgroundColor: ink(0.02), border: `1px solid ${ink(0.16)}` }
      : { backgroundColor: "#FFFFFF", border: `1px solid ${ink(0.14)}` };
  // "track" variant is used for navigation (tabs); "solid" is used for a
  // mutually-exclusive mode switch (radio group) — different semantics, so
  // screen readers describe them accurately rather than as generic buttons
  const groupRole = variant === "track" ? "tablist" : "radiogroup";
  const itemRole = variant === "track" ? "tab" : "radio";

  return (
    <div className="flex rounded-full p-1" style={trackStyle} role={groupRole} aria-label={ariaLabel}>
      <div className="flex" style={{ width: stretch ? "100%" : undefined, opacity: disabled ? 0.5 : 1, transition: "opacity 0.3s" }}>
        {options.map((o) => {
          const Icon = o.icon;
          const active = value === o.key;
          const activeStyle: CSSProperties =
            variant === "track"
              ? { backgroundColor: "#FFFFFF", color: COLORS.ink, border: `1px solid ${ink(0.16)}` }
              : { backgroundColor: COLORS.accent, color: "#FFFFFF" };
          return (
            <button
              key={o.key}
              role={itemRole}
              aria-selected={variant === "track" ? active : undefined}
              aria-checked={variant === "solid" ? active : undefined}
              onClick={() => !disabled && onChange(o.key)}
              disabled={disabled}
              className={`${stretch ? "flex-1" : ""} flex items-center justify-center gap-1 ${
                variant === "track" ? "py-2 font-medium" : "h-8 px-3 font-semibold"
              } rounded-full text-[11px] transition-all whitespace-nowrap disabled:cursor-not-allowed ${
                active && variant === "track" ? "shadow-sm" : ""
              }`}
              style={active ? activeStyle : { color: COLORS.muted }}
            >
              {Icon && <Icon size={12} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
