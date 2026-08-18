import { Sparkles, ScanLine } from "lucide-react";

export function AnalyzingState({ image, label = "Analyzing meal…", sub = "AI vision is extracting foods, portions, and macro data." }: { image?: string | null; label?: string; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card/60 p-6">
      <div className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col items-center gap-6 py-6">
        {image ? (
          <div className="relative h-56 w-full max-w-md overflow-hidden rounded-xl border border-primary/40">
            <img src={image} alt="" className="h-full w-full object-cover" />
            <div className="ai-scan-line absolute inset-x-0 top-0 h-24" />
            <div className="absolute inset-0 bg-[linear-gradient(transparent_22px,oklch(0.78_0.17_170/0.06)_22px)] bg-[length:100%_24px]" />
          </div>
        ) : (
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
            <ScanLine className="h-10 w-10 animate-pulse text-primary" />
            <span className="absolute -inset-1 rounded-2xl border border-primary/30 glow-border" />
          </div>
        )}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            {label}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className="grid w-full max-w-md grid-cols-4 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          {["Detect", "Portion", "USDA", "Macros"].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-border">
                <div className="liquid-fill absolute inset-y-0 left-0" style={{ width: `${(i + 1) * 25}%`, animationDelay: `${i * 0.2}s` }} />
              </div>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}