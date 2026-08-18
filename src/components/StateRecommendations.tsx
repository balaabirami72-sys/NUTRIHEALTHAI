import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles } from "lucide-react";
import {
  MINERALS, MINERAL_META, computeTargets, sumDay, useMeals, useProfile, type Mineral,
} from "@/lib/nutrition";
import { getStateCuisine } from "@/lib/state-cuisine";

/** Recommends famous dishes from the user's home state that fix their weakest nutrients. */
export function StateRecommendations() {
  const [profile] = useProfile();
  const [meals] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const cuisine = getStateCuisine(profile.state);

  const weakest = useMemo(() => {
    const totals = MINERALS.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<Mineral, number>);
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const day = sumDay(meals, d);
      for (const m of MINERALS) totals[m] += day[m];
    }
    return MINERALS
      .map((m) => ({ mineral: m, pct: targets[m] ? (totals[m] / (targets[m] * 7)) * 100 : 100 }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 6);
  }, [meals, targets]);

  const weakSet = useMemo(() => new Set(weakest.map((w) => w.mineral)), [weakest]);

  const ranked = useMemo(() => {
    if (!cuisine) return [];
    return cuisine.dishes
      .map((d) => ({ dish: d, hits: d.rich.filter((r) => weakSet.has(r)) }))
      .sort((a, b) => b.hits.length - a.hits.length)
      .slice(0, 4);
  }, [cuisine, weakSet]);

  if (!cuisine) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" /> Recommendations from your state
          </CardTitle>
          <CardDescription>
            Tell us where you live and we'll suggest famous dishes from your state that fix your current nutrient gaps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm"><Link to="/profile">Choose your state</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="state-reco-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <MapPin className="h-3.5 w-3.5" /> From your state
          </p>
          <h2 id="state-reco-heading" className="mt-1 text-2xl font-bold tracking-tight">
            {cuisine.label} favourites picked for your gaps
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{cuisine.tagline}</p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">Localized · 7-day gaps</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ranked.map(({ dish, hits }) => (
          <Card key={dish.name} className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{dish.name}</CardTitle>
              <CardDescription>{dish.note}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {dish.rich.map((r) => (
                  <Badge key={r} variant={weakSet.has(r) ? "default" : "outline"} className="text-[11px]">
                    {MINERAL_META[r].label}
                  </Badge>
                ))}
              </div>
              {hits.length > 0 && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3 w-3 text-primary" />
                  Covers {hits.map((h) => MINERAL_META[h].label).join(", ")} — currently among your lowest this week.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
