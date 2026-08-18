import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MEAL_TYPE_META, MINERALS, MINERAL_META, type Meal } from "@/lib/nutrition";

export function MealDetailDialog({ meal, open, onOpenChange }: { meal: Meal | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        {meal && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span>{MEAL_TYPE_META[meal.mealType].emoji}</span> {meal.name}
              </DialogTitle>
              <DialogDescription>
                {MEAL_TYPE_META[meal.mealType].label} ·{" "}
                {new Date(meal.loggedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Foods</div>
                <div className="flex flex-wrap gap-2">
                  {meal.foods.map((f) => (
                    <span key={f.name} className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-sm">
                      {f.name} <span className="text-muted-foreground">({f.grams}g)</span>
                    </span>
                  ))}
                </div>
              </div>
              {meal.prepNotes && (
                <div className="rounded-xl border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground">
                  {meal.prepNotes}
                </div>
              )}
              {(["macronutrient", "vitamin", "macro", "trace"] as const).map((g) => {
                const keys = MINERALS.filter((k) => MINERAL_META[k].group === g && (meal.minerals[k] ?? 0) > 0);
                if (!keys.length) return null;
                const title = g === "macronutrient" ? "Macronutrients" : g === "vitamin" ? "Vitamins" : g === "macro" ? "Macrominerals" : "Trace minerals";
                return (
                  <div key={g}>
                    <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {keys.map((k) => (
                        <div key={k} className="rounded-xl border border-border/40 bg-background/40 p-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full" style={{ background: MINERAL_META[k].color }} />
                            {MINERAL_META[k].label}
                          </div>
                          <div className="mt-1 text-base font-semibold tabular-nums">
                            {(meal.minerals[k] ?? 0).toFixed(1)}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">{MINERAL_META[k].unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}