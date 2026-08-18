import { Flame, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useMeals } from "@/lib/nutrition";
import { useStreak } from "@/lib/streak";

export function StreakBadge() {
  const [meals] = useMeals();
  const { current, best, loggedToday } = useStreak(meals);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-32" />;

  const hot = current >= 3;
  const label = current === 0 ? "Start a streak" : `${current} Day${current === 1 ? "" : "s"} ${hot ? "Hot!" : "🔥"}`;
  const wrapBase = "group relative flex h-9 items-center gap-2 overflow-hidden rounded-full border px-3 text-xs font-semibold tracking-wide transition";
  const wrapTone = hot
    ? "border-primary/60 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-orange-500/20 text-amber-200 glow-border"
    : current > 0
    ? "border-primary/40 bg-primary/10 text-primary"
    : "border-border/60 bg-background/60 text-muted-foreground";
  return (
    <div className={`${wrapBase} ${wrapTone}`} title={`Best streak: ${best} days`}>
      <Flame className={`h-4 w-4 ${hot ? "text-amber-300" : ""}`} />
      <span className="tabular-nums">🔥 {label}</span>
      {best > current && (
        <span className="flex items-center gap-1 border-l border-border/40 pl-2 text-[10px] text-muted-foreground">
          <Trophy className="h-3 w-3" /> {best}
        </span>
      )}
      {!loggedToday && current > 0 && (
        <span className="absolute -bottom-px left-3 right-3 h-px bg-amber-400/60" />
      )}
    </div>
  );
}