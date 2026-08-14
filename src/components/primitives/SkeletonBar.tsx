import { ink } from "../../theme/colors";

// a standardized loading placeholder for card rows whose info hasn't been
// collected yet — keeps the card's layout fixed instead of growing/shrinking
// as fields resolve
export function SkeletonBar({ width = 100, height = 11 }: { width?: number; height?: number }) {
  return (
    <span
      className="inline-block rounded-full animate-pulse"
      style={{ width, height, backgroundColor: ink(0.09) }}
    />
  );
}
