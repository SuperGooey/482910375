// ---- lightweight helpers for card-background mini-maps & schedule strips ----
export function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function polarPos(seed: number, distancePct: number): { x: number; y: number } {
  const angle = (seed % 360) * (Math.PI / 180);
  return { x: 50 + distancePct * Math.cos(angle), y: 50 + distancePct * Math.sin(angle) };
}
