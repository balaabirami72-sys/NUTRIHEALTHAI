import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BodySilhouette } from "@/components/BodySilhouette";
import { BODY_REGIONS, REGION_META, mineralsForRegion, regionsForMineral, type BodyRegion } from "@/lib/body-map";
import { MINERAL_META, MINERALS, SUGGESTIONS, computeTargets, sumDay, useMeals, useProfile, type Mineral } from "@/lib/nutrition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PersonStanding, Sparkles } from "lucide-react";

export const Route = createFileRoute("/body")({
  head: () => ({
    meta: [
      { title: "Body Map — Nutri Health AI" },
      { name: "description", content: "Interactive body map — see which parts of you each nutrient supports and where you're running low." },
      { property: "og:title", content: "Body Map — Nutri Health AI" },
      { property: "og:description", content: "Interactive body map — see which parts of you each nutrient supports and where you're running low." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    mineral: (typeof s.mineral === "string" ? s.mineral : undefined) as Mineral | undefined,
  }),
  component: BodyMap,
});

function BodyMap() {
  const search = Route.useSearch();
  const [profile] = useProfile();
  const [meals] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const today = useMemo(() => sumDay(meals, new Date()), [meals]);

  // 7-day totals for overlay
  const week = useMemo(() => {
    const acc: Record<Mineral, number> = { ...today };
    for (const k of MINERALS) acc[k] = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const day = sumDay(meals, d);
      for (const k of MINERALS) acc[k] += day[k];
    }
    return acc;
  }, [meals, today]);

  const [selected, setSelected] = useState<Mineral>((search.mineral as Mineral) || "iron");
  const [showOverlay, setShowOverlay] = useState(false);
  const [region, setRegion] = useState<BodyRegion | null>(null);

  const active = regionsForMineral(selected);

  const overlay = useMemo(() => {
    if (!showOverlay) return undefined;
    const map: Partial<Record<BodyRegion, "mint" | "amber" | "rose">> = {};
    for (const r of BODY_REGIONS) {
      const mins = mineralsForRegion(r);
      if (!mins.length) continue;
      // worst mineral status for this region
      let worst = 100;
      for (const m of mins) {
        const pct = (week[m] / (targets[m] * 7)) * 100;
        if (pct < worst) worst = pct;
      }
      if (worst < 50) map[r] = "rose";
      else if (worst < 80) map[r] = "amber";
      else map[r] = "mint";
    }
    return map;
  }, [showOverlay, week, targets]);

  const regionMinerals = region ? mineralsForRegion(region) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Interactive Body Map</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <PersonStanding className="h-7 w-7 text-primary" /> Where nutrients live in you
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tap a nutrient to see the parts of you it supports. Tap a body region to see what feeds it.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-2">
          <Switch checked={showOverlay} onCheckedChange={setShowOverlay} id="overlay" />
          <Label htmlFor="overlay" className="cursor-pointer text-sm">7-day deficiency overlay</Label>
        </label>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr_1fr]">
        {/* Mineral chip rail */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nutrients</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] space-y-1 overflow-auto pr-1">
            {MINERALS.filter((m) => regionsForMineral(m).length > 0).map((m) => {
              const on = selected === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelected(m)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    on ? "border-primary bg-primary/10 text-foreground shadow-[var(--shadow-glow)]" : "border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: MINERAL_META[m].color }} />
                  <span className="truncate">{MINERAL_META[m].label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Silhouette */}
        <Card className="relative overflow-hidden border-border/60 bg-card/60">
          <CardContent className="p-4">
            <div className="absolute inset-0 -z-0 opacity-40" style={{
              background: `radial-gradient(circle at 50% 30%, ${MINERAL_META[selected].color}22, transparent 60%)`,
            }} />
            <div className="relative mx-auto max-w-[320px]">
              <BodySilhouette
                active={active}
                tone="primary"
                overlay={overlay}
                onRegionClick={(r) => setRegion(r)}
                className="h-[520px] w-full"
              />
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {active.map((r) => (
                <Badge key={r} variant="outline" className="border-primary/40 text-primary">
                  {REGION_META[r].label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: MINERAL_META[selected].color }} />
              {MINERAL_META[selected].label}
            </CardTitle>
            <CardDescription>
              Today {today[selected].toFixed(1)} / {targets[selected]} {MINERAL_META[selected].unit}
              {" · "}
              {Math.round((today[selected] / targets[selected]) * 100)}% of target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Supports these parts of you</div>
              <div className="space-y-2">
                {active.map((r) => (
                  <div key={r} className="rounded-lg border border-border/40 bg-background/40 p-3">
                    <div className="font-medium">{REGION_META[r].label}</div>
                    <div className="text-xs text-muted-foreground">{REGION_META[r].blurb}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3 w-3 text-accent" /> Foods that feed it
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS[selected].map((s) => (
                  <span key={s} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs">{s}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={region !== null} onOpenChange={(v) => !v && setRegion(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {region && (
            <>
              <SheetHeader>
                <SheetTitle>{REGION_META[region].label}</SheetTitle>
                <SheetDescription>{REGION_META[region].blurb}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Fueled by</div>
                {regionMinerals.map((m) => {
                  const pct = (today[m] / targets[m]) * 100;
                  const tone = pct >= 80 ? "text-primary" : pct >= 40 ? "text-amber-400" : "text-rose-400";
                  return (
                    <button
                      key={m}
                      onClick={() => { setSelected(m); setRegion(null); }}
                      className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3 text-left transition hover:border-primary/40"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: MINERAL_META[m].color }} />
                        <span className="font-medium">{MINERAL_META[m].label}</span>
                      </div>
                      <span className={`text-xs tabular-nums font-medium ${tone}`}>{Math.round(pct)}%</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}