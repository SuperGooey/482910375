// stands in for a chat bubble's content while that turn is "being spoken",
// before it resolves into transcribed text — reinforces that this is a live
// voice call, not a text thread
export function Waveform({ color = "currentColor" }: { color?: string }) {
  const bars = [0.5, 0.9, 0.35, 1, 0.6];
  return (
    <div className="flex items-center gap-[3px] h-4" aria-hidden="true">
      <style>{`@keyframes waveBar{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}`}</style>
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-[3px] h-full rounded-full"
          style={{
            backgroundColor: color,
            animation: `waveBar ${0.7 + b * 0.3}s ease-in-out ${i * 0.11}s infinite`,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}
