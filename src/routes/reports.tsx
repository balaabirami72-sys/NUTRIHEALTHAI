import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MINERALS, MINERAL_META, SUGGESTIONS, computeTargets, sumDay, useMeals, useProfile, type Mineral } from "@/lib/nutrition";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { AlertTriangle, Sparkles, TrendingDown, Lightbulb } from "lucide-react";
import { DoctorReportCard } from "@/components/DoctorReportCard";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Weekly Deficits & Reports — Nutri Health AI" },
      { name: "description", content: "See the last 7 days of mineral intake vs personalized weekly limits." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const [profile] = useProfile();
  const [meals] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const [active, setActive] = useState<Mineral>("iron");
  const [range, setRange] = useState<7 | 30>(7);

  const days = useMemo(() => {
    const arr: { label: string; date: Date; totals: Record<Mineral, number> }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({
        label: range === 7
          ? d.toLocaleDateString(undefined, { weekday: "short" })
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        date: d,
        totals: sumDay(meals, d),
      });
    }
    return arr;
  }, [meals, range]);

  const chartData = days.map((d) => ({ day: d.label, intake: +d.totals[active].toFixed(1), target: targets[active] }));

  const periodTotals: Record<Mineral, number> = MINERALS.reduce((acc, m) => {
    acc[m] = days.reduce((s, d) => s + d.totals[m], 0);
    return acc;
  }, {} as Record<Mineral, number>);

  const deficits = MINERALS.map((m) => {
    const periodTarget = targets[m] * range;
    const pct = (periodTotals[m] / periodTarget) * 100;
    return { mineral: m, pct, weekly: periodTotals[m], target: periodTarget };
  }).filter((d) => d.pct < 70).sort((a, b) => a.pct - b.pct);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">{range}-Day Report</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Your {range === 7 ? "week" : "month"} in minerals
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Intake vs personalized targets — spot chronic deficiencies and surpluses.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border/60 bg-background/40 p-1">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === 7 ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{MINERAL_META[active].label} — last {range} days</CardTitle>
            <CardDescription>
              Daily target {targets[active]} {MINERAL_META[active].unit} · {range}-day target {targets[active] * range} {MINERAL_META[active].unit}
            </CardDescription>
          </div>
          <select
            value={active}
            onChange={(e) => setActive(e.target.value as Mineral)}
            className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
          >
            <optgroup label="Macronutrients">
              {MINERALS.filter((m) => MINERAL_META[m].group === "macronutrient").map((m) => (
                <option key={m} value={m}>{MINERAL_META[m].label}</option>
              ))}
            </optgroup>
            <optgroup label="Vitamins">
              {MINERALS.filter((m) => MINERAL_META[m].group === "vitamin").map((m) => (
                <option key={m} value={m}>{MINERAL_META[m].label}</option>
              ))}
            </optgroup>
            <optgroup label="Macrominerals">
              {MINERALS.filter((m) => MINERAL_META[m].group === "macro").map((m) => (
                <option key={m} value={m}>{MINERAL_META[m].label}</option>
              ))}
            </optgroup>
            <optgroup label="Trace minerals">
              {MINERALS.filter((m) => MINERAL_META[m].group === "trace").map((m) => (
                <option key={m} value={m}>{MINERAL_META[m].label}</option>
              ))}
            </optgroup>
          </select>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 250)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.72 0.02 240)" tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.02 240)" tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "oklch(0.3 0.03 250 / 0.4)" }}
                  contentStyle={{ background: "oklch(0.2 0.025 252)", border: "1px solid oklch(0.32 0.03 250)", borderRadius: 12, color: "oklch(0.97 0.01 230)" }}
                  formatter={(v: number) => [`${v} ${MINERAL_META[active].unit}`, "Intake"]}
                />
                <ReferenceLine y={targets[active]} stroke="oklch(0.78 0.17 170)" strokeDasharray="4 4" label={{ value: "Daily target", position: "insideTopRight", fill: "oklch(0.78 0.17 170)", fontSize: 11 }} />
                <Bar dataKey="intake" fill={MINERAL_META[active].color} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-400" /> Weekly deficiency tracker</CardTitle>
            <CardDescription>{range}-day intake below 70% of target.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deficits.length === 0 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
                You're hitting every mineral target this {range === 7 ? "week" : "month"}. Excellent.
              </div>
            )}
            {deficits.map((d) => {
              const tone = d.pct < 40 ? "border-rose-500/40 bg-rose-500/5" : "border-amber-500/40 bg-amber-500/5";
              const text = d.pct < 40 ? "text-rose-300" : "text-amber-300";
              return (
                <div key={d.mineral} className={`relative overflow-hidden rounded-xl border ${tone} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{MINERAL_META[d.mineral].label} deficit</div>
                    <Badge variant="outline" className={`tabular-nums ${text}`}>{Math.round(d.pct)}% of {range}d</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {d.weekly.toFixed(0)} / {d.target} {MINERAL_META[d.mineral].unit} over {range} days
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/40">
                    <div className="liquid-fill h-full" style={{ width: `${Math.max(4, Math.min(100, d.pct))}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
              </span>
              AI Nutritionist suggestions
            </CardTitle>
            <CardDescription>
              {deficits.length > 0
                ? `${deficits.length} deficienc${deficits.length === 1 ? "y" : "ies"} detected · bioavailable picks to close the gap${profile.menstruating ? " (iron-forward)" : ""}.`
                : "You're on track — here are foods to keep variety high."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(deficits.length > 0 ? deficits.map((d) => d.mineral) : MINERALS).slice(0, 4).map((m) => (
              <div key={m} className="rounded-xl border border-border/40 bg-background/40 p-3 transition hover:border-primary/40">
                <div className="mb-2 flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: MINERAL_META[m].color }} />
                  {MINERAL_META[m].label}
                </div>
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS[m].map((s) => (
                    <span key={s} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-foreground/80">{s}</span>
                  ))}
                </div>
              </div>
            ))}
            {deficits.length === 0 && (
              <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                Tip: rotate proteins (legumes ↔ fish ↔ poultry) weekly to keep B12, iron and zinc balanced.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <DoctorReportCard />
    </div>
  );
}