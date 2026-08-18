import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MineralRing } from "@/components/MineralRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MINERALS, MINERAL_META, MEAL_TYPES, MEAL_TYPE_META, computeTargets, sumDay, useMeals, useProfile, type Meal } from "@/lib/nutrition";
import { ScanLine, Trash2, Sparkles, Flame, PersonStanding, Zap, ArrowRight } from "lucide-react";
import { MealDetailDialog } from "@/components/MealDetailDialog";
import { BodySilhouette } from "@/components/BodySilhouette";
import { regionsForMineral } from "@/lib/body-map";
import { greetingForNow } from "@/lib/voice";
import { IndianCatalogGrid } from "@/components/IndianCatalogGrid";
import { ProactiveAlerts } from "@/components/ProactiveAlerts";
import { StateRecommendations } from "@/components/StateRecommendations";
import { DoctorBridge } from "@/components/DoctorBridge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Dashboard — Nutri Health AI" },
      { name: "description", content: "Indian-first micronutrient tracking with proactive 7-day deficiency alerts and a doctor-ready report." },
      { property: "og:title", content: "Daily Dashboard — Nutri Health AI" },
      { property: "og:description", content: "Indian-first micronutrient tracking with proactive 7-day deficiency alerts and a doctor-ready report." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [profile] = useProfile();
  const [meals, , remove] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const today = useMemo(() => sumDay(meals, new Date()), [meals]);
  const [openMeal, setOpenMeal] = useState<Meal | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const todaysMeals = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    return meals.filter((m) => new Date(m.loggedAt) >= start);
  }, [meals]);
  const mealsByType = useMemo(() => {
    const g: Record<string, typeof todaysMeals> = { breakfast: [], lunch: [], snack: [], dinner: [] };
    for (const m of todaysMeals) (g[m.mealType] ||= []).push(m);
    for (const k of Object.keys(g)) g[k].sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
    return g;
  }, [todaysMeals]);

  const greeting = mounted ? greetingForNow() : "Welcome";

  // Two lowest minerals today to spotlight on the body mini-map
  const lowest = useMemo(() => {
    return [...MINERALS]
      .map((m) => ({ m, pct: (today[m] / targets[m]) * 100 }))
      .filter((x) => regionsForMineral(x.m).length > 0)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 2);
  }, [today, targets]);
  const spotlightRegions = useMemo(
    () => Array.from(new Set(lowest.flatMap((l) => regionsForMineral(l.m)))),
    [lowest],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <BentoHero
        profile={profile}
        greeting={greeting}
        targets={targets}
        today={today}
        streak={streakDays(meals)}
        lowest={lowest}
        spotlightRegions={spotlightRegions}
      />

      <ProactiveAlerts />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-primary" /> Today's meals
            </CardTitle>
            <Badge variant="secondary" className="tabular-nums">{todaysMeals.length} logged</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {todaysMeals.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No meals yet today. <Link to="/scanner" className="text-primary underline-offset-4 hover:underline">Scan your first plate →</Link>
              </div>
            )}
            {MEAL_TYPES.filter((mt) => mealsByType[mt]?.length).map((mt) => (
              <div key={mt} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="text-sm">{MEAL_TYPE_META[mt].emoji}</span>
                    {MEAL_TYPE_META[mt].label}
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{mealsByType[mt].length} item{mealsByType[mt].length > 1 ? "s" : ""}</span>
                </div>
                {mealsByType[mt].map((m) => (
                  <div key={m.id}
                       onClick={() => setOpenMeal(m)}
                       className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 p-3 transition hover:border-primary/50 hover:bg-primary/5 hover:shadow-[var(--shadow-glow)]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{m.name}</span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {new Date(m.loggedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {m.foods.map((f) => `${f.name} (${f.grams}g)`).join(" · ")}
                      </div>
                    </div>
                    <div className="hidden flex-wrap gap-1 sm:flex">
                      {MINERALS.filter((k) => (m.minerals[k] ?? 0) > 0).slice(0, 6).map((k) => (
                        <span key={k} className="rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                          {MINERAL_META[k].label[0]} {(m.minerals[k] ?? 0).toFixed(0)}
                        </span>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove(m.id); }} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-accent" /> Smart insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {MINERALS.map((m) => {
              const pct = (today[m] / targets[m]) * 100;
              const status = pct >= 80 ? "on track" : pct >= 40 ? "needs a boost" : "low";
              const tone = pct >= 80 ? "text-primary" : pct >= 40 ? "text-amber-400" : "text-rose-400";
              return (
                <div key={m} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                  <span>{MINERAL_META[m].label}</span>
                  <span className={`text-xs font-medium uppercase tracking-wide ${tone}`}>{status}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">Essentials · at a glance</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {(["protein", "carbohydrates", "fat", "fiber", "iron", "calcium", "vitamin_c", "vitamin_d"] as const).map((m) => (
              <MineralRing key={m} mineral={m} value={today[m]} target={targets[m]} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Macronutrients</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {MINERALS.filter((m) => MINERAL_META[m].group === "macronutrient").map((m) => (
              <MineralRing key={m} mineral={m} value={today[m]} target={targets[m]} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Vitamins</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
            {MINERALS.filter((m) => MINERAL_META[m].group === "vitamin").map((m) => (
              <MineralRing key={m} mineral={m} value={today[m]} target={targets[m]} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Macrominerals</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {MINERALS.filter((m) => MINERAL_META[m].group === "macro").map((m) => (
              <MineralRing key={m} mineral={m} value={today[m]} target={targets[m]} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Trace minerals</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
            {MINERALS.filter((m) => MINERAL_META[m].group === "trace").map((m) => (
              <MineralRing key={m} mineral={m} value={today[m]} target={targets[m]} />
            ))}
          </div>
        </div>
      </section>

      <MealDetailDialog meal={openMeal} open={openMeal !== null} onOpenChange={(v) => !v && setOpenMeal(null)} />

      <IndianCatalogGrid />

      <StateRecommendations />

      <DoctorBridge />
    </div>
  );
}

/* ---------- Editorial bento hero ---------- */

function streakDays(meals: Meal[]): number {
  if (!meals.length) return 0;
  const days = new Set(
    meals.map((m) => {
      const d = new Date(m.loggedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );
  let count = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.getTime())) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

type BentoHeroProps = {
  profile: ReturnType<typeof useProfile>[0];
  greeting: string;
  targets: Record<string, number>;
  today: Record<string, number>;
  streak: number;
  lowest: { m: (typeof MINERALS)[number]; pct: number }[];
  spotlightRegions: ReturnType<typeof regionsForMineral>;
};

function BentoHero({ profile, greeting, targets, today, streak, lowest, spotlightRegions }: BentoHeroProps) {
  const kcalTarget = Math.max(1, targets.calories ?? 2000);
  const kcalToday = today.calories ?? 0;
  const kcalLeft = Math.max(0, Math.round(kcalTarget - kcalToday));
  const pct = Math.min(1, kcalToday / kcalTarget);
  const R = 80;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - pct);

  const macros: { key: "protein" | "carbohydrates" | "fat"; label: string }[] = [
    { key: "protein", label: "Protein" },
    { key: "carbohydrates", label: "Carbs" },
    { key: "fat", label: "Fats" },
  ];

  const chipMinerals = (["iron", "calcium", "magnesium", "zinc"] as const).filter((k) => k in targets);

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
      {/* Greeting */}
      <div className="flex flex-col justify-end p-2 md:col-span-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{greeting}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
          {profile.name.split(" ")[0]}, here's today's picture.
        </h1>
        <p className="mt-2 max-w-xl text-base italic text-muted-foreground">
          Personalized for your body — {profile.age}yo {profile.sex}
          {profile.hrt ? " · HRT" : ""}
          {profile.menstruating ? " · menstruating" : ""}.
        </p>
      </div>

      {/* Streak tile */}
      <div className="glass flex items-center justify-between rounded-[2rem] p-6 shadow-sm md:col-span-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Daily streak</p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {streak} <span className="text-base font-medium text-muted-foreground">day{streak === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-[0_12px_28px_-10px_var(--accent)]">
          <Zap className="h-7 w-7" />
        </div>
      </div>

      {/* Main calorie ring + macros */}
      <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-[2.5rem] bg-primary p-8 text-primary-foreground md:col-span-7 md:row-span-2 md:flex-row">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative shrink-0">
          <svg className="h-48 w-48 -rotate-90" viewBox="0 0 192 192">
            <circle cx="96" cy="96" r={R} stroke="currentColor" strokeWidth="16" fill="transparent" className="opacity-20" />
            <circle
              cx="96" cy="96" r={R}
              stroke="var(--accent)" strokeWidth="16" fill="transparent"
              strokeDasharray={C} strokeDashoffset={dashOffset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold tabular-nums">{kcalLeft.toLocaleString()}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">kcal left</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4">
          <h2 className="text-2xl font-bold">Daily target</h2>
          <div className="space-y-3">
            {macros.map((mac) => {
              const v = today[mac.key] ?? 0;
              const t = Math.max(1, targets[mac.key] ?? 1);
              const p = Math.min(1, v / t);
              return (
                <div key={mac.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wide">
                    <span className="opacity-80">{mac.label}</span>
                    <span className="tabular-nums">{Math.round(v)}g / {Math.round(t)}g</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
                    <div
                      className="h-full rounded-full bg-primary-foreground"
                      style={{ width: `${p * 100}%`, transition: "width 900ms cubic-bezier(.4,0,.2,1)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Button asChild variant="secondary" className="mt-2 w-fit rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/reports">See full report<ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      {/* Body map card */}
      <Link
        to="/body"
        search={lowest[0] ? { mineral: lowest[0].m } : undefined}
        className="group flex flex-col justify-between rounded-[2.5rem] border border-border/60 bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)] md:col-span-5 md:row-span-2"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold leading-tight">Your body<br/>today</h3>
          <span className="rounded-full bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            <PersonStanding className="mr-1 inline h-3 w-3" /> Vital signs
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center py-4">
          <BodySilhouette active={spotlightRegions} tone="warm" className="h-36 w-16 opacity-80 transition group-hover:opacity-100" compact />
        </div>
        <p className="mb-3 text-center text-sm text-muted-foreground">
          {lowest.length ? (
            <>Low on <span className="font-semibold text-foreground">{lowest.map((l) => MINERAL_META[l.m].label).join(" & ")}</span> — tap for foods that help.</>
          ) : (
            <>Every system is well fed today. Keep going.</>
          )}
        </p>
        <div className="w-full rounded-2xl border border-border/60 bg-background/60 py-3 text-center text-sm font-bold transition group-hover:bg-foreground group-hover:text-background">
          View body map
        </div>
      </Link>

      {/* Mineral status chips */}
      <div className="grid grid-cols-2 gap-4 md:col-span-12 md:grid-cols-4">
        {chipMinerals.map((k) => {
          const v = today[k] ?? 0;
          const t = Math.max(1, targets[k] ?? 1);
          const p = Math.min(1, v / t);
          const strokeColor = p >= 0.8 ? "var(--primary)" : p >= 0.4 ? "var(--accent)" : "oklch(0.62 0.22 25)";
          return (
            <div key={k} className="flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="relative h-11 w-11">
                <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" stroke="var(--muted)" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="22" cy="22" r="18"
                    stroke={strokeColor} strokeWidth="4" fill="transparent"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - p)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase">
                  {MINERAL_META[k].label.slice(0, 2)}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{MINERAL_META[k].label}</p>
                <p className="text-lg font-bold tabular-nums">{Math.round(p * 100)}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick scan CTA — replaces the top-right button */}
      <div className="flex flex-col justify-between rounded-[2rem] bg-accent p-6 text-accent-foreground shadow-[0_16px_40px_-12px_var(--accent)] md:col-span-4">
        <div>
          <p className="text-lg font-bold">New intake?</p>
          <p className="mt-1 text-sm opacity-90">Scan your meal to auto-log macros and micronutrients.</p>
        </div>
        <Button asChild size="lg" className="mt-6 w-full rounded-2xl bg-background text-foreground hover:bg-background/90">
          <Link to="/scanner"><ScanLine className="mr-2 h-4 w-4" /> Quick scan</Link>
        </Button>
      </div>

      {/* Placeholder to preserve grid rhythm on wide screens — merged with existing meals section below */}
      <div className="hidden md:col-span-8 md:block" />
    </section>
  );
}
