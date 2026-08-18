import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import { getCategory, INDIAN_CATALOG, type CatalogCategory } from "@/lib/indian-catalog";
import { MINERAL_META, type Mineral } from "@/lib/nutrition";

export const Route = createFileRoute("/catalog/$category")({
  head: ({ params }) => {
    const cat = getCategory(params.category);
    const title = cat ? `${cat.label} — Nutri Health AI` : "Catalog — Nutri Health AI";
    return {
      meta: [
        { title },
        { name: "description", content: cat?.tagline ?? "Indian nutrition catalog" },
      ],
    };
  },
  loader: ({ params }) => {
    const cat: CatalogCategory | undefined = getCategory(params.category);
    if (!cat) throw notFound();
    return { cat: cat as CatalogCategory };
  },
  component: CatalogCategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-2xl font-semibold">Catalog not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try one of our Indian catalog categories.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {INDIAN_CATALOG.map((c) => (
          <Button key={c.slug} asChild variant="outline" size="sm">
            <Link to="/catalog/$category" params={{ category: c.slug }}>{c.emoji} {c.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  ),
});

function CatalogCategoryPage() {
  const { cat } = Route.useLoaderData() as { cat: CatalogCategory };
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground">
          <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard</Link>
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Indian catalog</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            <span aria-hidden className="mr-2">{cat.emoji}</span>{cat.label}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{cat.tagline}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cat.items.map((it) => (
          <Card key={it.name} className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{it.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3 text-primary/70" /> {it.region}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{it.note}</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(it.minerals) as [Mineral, string][]).map(([m, level]) => (
                  <Badge
                    key={m}
                    variant="outline"
                    className="border-primary/30 bg-primary/5 text-[10px] uppercase tracking-wide text-primary"
                  >
                    <Sparkles className="mr-1 h-2.5 w-2.5" />
                    {MINERAL_META[m].label} · {level}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Browse more</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INDIAN_CATALOG.filter((c) => c.slug !== cat.slug).map((c) => (
            <Button key={c.slug} asChild variant="outline" size="sm">
              <Link to="/catalog/$category" params={{ category: c.slug }}>
                {c.emoji} {c.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}