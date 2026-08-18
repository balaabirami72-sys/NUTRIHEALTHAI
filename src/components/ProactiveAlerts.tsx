import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BellRing, ShieldCheck, Utensils, TrendingDown } from "lucide-react";
import {
  MINERALS,
  MINERAL_META,
  computeTargets,
  sumDay,
  useMeals,
  useProfile,
  type Mineral,
} from "@/lib/nutrition";
import { remediesFor } from "@/lib/indian-catalog";
import { localRemediesFor } from "@/lib/state-cuisine";

/** 7-day rolling deficiency scan with Indian-food remediation. */
export function ProactiveAlerts() {
  const [profile] = useProfile();
  const [meals] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const stateCode = profile.state;

  const alerts = useMemo(() => {
    const totals: Record<Mineral, number> = MINERALS.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<Mineral, number>);
    const dailyPct: Record<Mineral, number[]> = MINERALS.reduce((acc, m) => { acc[m] = []; return acc; }, {} as Record<Mineral, number[]>);
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const day = sumDay(meals, d);
      for (const m of MINERALS) {
        totals[m] += day[m];
        dailyPct[m].push(targets[m] ? (day[m] / targets[m]) * 100 : 0);
      }
    }
    const rows = MINERALS.map((m) => {
      const weekTarget = targets[m] * 7;
      const pct = weekTarget ? (totals[m] / weekTarget) * 100 : 0;
      // trend: avg of last 3 vs previous 4
      const recent = dailyPct[m].slice(0, 3).reduce((s, x) => s + x, 0) / 3;
      const older = dailyPct[m].slice(3).reduce((s, x) => s + x, 0) / 4;
      const trend = recent - older;
      return { mineral: m, pct, trend };
    })
    .filter((r) => r.pct < 70)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);
    return rows;
  }, [meals, targets]);

  return (
    <section aria-labelledby="proactive-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <BellRing className="h-3.5 w-3.5" /> Proactive alerts
          </p>
          <h2 id="proactive-heading" className="mt-1 text-2xl font-bold tracking-tight">
            7-day rolling scan · we flag deficits before you feel them
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Our algorithm reviews the last week continuously. Any nutrient below <span className="font-semibold text-foreground">70% of RDA</span> triggers an alert with an Indian-kitchen fix.
          </p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Rolling algorithm · v1
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-6">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">No active alerts</p>
              <p className="text-sm text-muted-foreground">Every tracked nutrient is above 70% of your 7-day RDA. We'll keep watching.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {alerts.map((a) => {
            const severe = a.pct < 40;
            return (
              <Card
                key={a.mineral}
                className={`overflow-hidden border ${severe ? "border-rose-500/50 bg-rose-500/5" : "border-amber-500/50 bg-amber-500/5"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className={`h-4 w-4 ${severe ? "text-rose-400" : "text-amber-400"}`} />
                      {MINERAL_META[a.mineral].label} deficiency alert
                    </CardTitle>
                    <Badge variant="outline" className="tabular-nums">
                      {Math.round(a.pct)}% of 7-day RDA
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <TrendingDown className={`h-3 w-3 ${a.trend < 0 ? "text-rose-400" : "text-muted-foreground"}`} />
                    Trend: {a.trend >= 0 ? "improving" : "declining"} vs earlier this week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(100, a.pct))}%`,
                        background: severe ? "oklch(0.65 0.22 25)" : "oklch(0.78 0.17 70)",
                      }}
                    />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Utensils className="h-3 w-3" /> Indian-kitchen corrections
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {(() => {
                        const local = localRemediesFor(stateCode, a.mineral).map((r) => ({ ...r, local: true as const }));
                        const generic = remediesFor(a.mineral).map((r) => ({ ...r, state: undefined as string | undefined, local: false as const }));
                        const seen = new Set<string>();
                        return [...local, ...generic].filter((r) => !seen.has(r.food) && seen.add(r.food)).slice(0, 3);
                      })().map((r) => (
                        <li key={r.food} className="rounded-lg border border-border/40 bg-background/60 p-2">
                          <div className="flex items-center gap-2 font-medium">
                            {r.food}
                            {r.local && (
                              <Badge variant="secondary" className="text-[10px]">Local · {r.state}</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{r.how}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}