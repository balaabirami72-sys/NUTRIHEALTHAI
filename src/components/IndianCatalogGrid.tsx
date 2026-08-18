import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { INDIAN_CATALOG } from "@/lib/indian-catalog";

export function IndianCatalogGrid() {
  return (
    <section aria-labelledby="indian-catalog-heading" className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Indian nutrition catalogs</p>
          <h2 id="indian-catalog-heading" className="mt-1 text-2xl font-bold tracking-tight">
            Eat from your kitchen, not a Western textbook
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Browse dishes organized by regional Indian tradition — every card links to a full catalog view.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDIAN_CATALOG.map((cat) => (
          <Card
            key={cat.slug}
            className="group relative overflow-hidden border-border/60 bg-card/60 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/20" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span aria-hidden className="text-2xl">{cat.emoji}</span>
                {cat.label}
              </CardTitle>
              <CardDescription>{cat.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm">
                {cat.items.slice(0, 3).map((it) => (
                  <li key={it.name} className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
                    <span>
                      <span className="font-medium text-foreground">{it.name}</span>
                      <span className="text-muted-foreground"> · {it.region}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {cat.items.length} dishes
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Link to="/catalog/$category" params={{ category: cat.slug }}>
                    See all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}