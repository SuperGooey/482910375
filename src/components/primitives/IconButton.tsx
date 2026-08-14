import type { LucideIcon } from "lucide-react";
import { COLORS } from "../../theme/colors";

export function IconButton({
  icon: Icon,
  active,
  danger,
  onClick,
  label,
  size = "md",
}: {
  icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "w-9 h-9 rounded-full" : "w-12 h-12 rounded-full";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${dims} flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95
        ${danger ? "bg-[#FFE8E8] text-[#E4534B] hover:bg-[#ffd9d9]" : !active ? "bg-[#F1F2F8] text-[#454B5C] hover:bg-[#e7e9f4]" : ""}`}
      style={active && !danger ? { backgroundColor: COLORS.accent, color: "#FFFFFF" } : undefined}
    >
      <Icon size={size === "sm" ? 15 : 19} strokeWidth={2} />
    </button>
  );
}
