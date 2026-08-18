import { MINERAL_META, type Mineral } from "@/lib/nutrition";

export function MineralRing({
  mineral,
  value,
  target,
}: {
  mineral: Mineral;
  value: number;
  target: number;
}) {
  const meta = MINERAL_META[mineral];
  const pct = Math.min(100, Math.round((value / target) * 100));
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-5 transition hover:border-primary/40 hover:shadow-[var(--shadow-glow)]">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="oklch(0.3 0.03 250)" strokeWidth="10" />
          <circle
            cx="70" cy="70" r={r} fill="none"
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{pct}%</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{meta.label}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm tabular-nums">
          <span className="font-medium">{value.toFixed(1)}</span>
          <span className="text-muted-foreground"> / {target} {meta.unit}</span>
        </div>
      </div>
    </div>
  );
}