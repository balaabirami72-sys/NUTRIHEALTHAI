import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MINERALS, MINERAL_META, ACTIVITY_META, computeTargets, useProfile, type ActivityLevel, type Profile } from "@/lib/nutrition";
import { toast } from "sonner";
import { Save, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { usePremium } from "@/lib/premium";
import { STATE_CUISINES } from "@/lib/state-cuisine";
import { VOICE } from "@/lib/voice";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & RDA Targets — Nutri Health AI" },
      { name: "description", content: "Configure demographics for clinically adjusted mineral RDA targets." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [saved, setSaved] = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  useEffect(() => setDraft(saved), [saved]);
  const targets = useMemo(() => computeTargets(draft), [draft]);
  const [premium, setPremium] = usePremium();

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Profile</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Demographics & RDA targets</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your mineral targets adjust live as you change inputs — based on clinical guidance for age, sex, HRT, and menstruation.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
            <CardDescription>Used only on this device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={draft.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" min={1} max={120} value={draft.age}
                  onChange={(e) => update("age", Math.max(1, Math.min(120, Number(e.target.value) || 0)))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" min={20} max={250} value={draft.weightKg}
                  onChange={(e) => update("weightKg", Math.max(20, Math.min(250, Number(e.target.value) || 0)))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity">Activity level</Label>
                <select
                  id="activity"
                  value={draft.activity}
                  onChange={(e) => update("activity", e.target.value as ActivityLevel)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {(Object.keys(ACTIVITY_META) as ActivityLevel[]).map((a) => (
                    <option key={a} value={a}>{ACTIVITY_META[a].label} — {ACTIVITY_META[a].desc}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="state">Home state (for regional food picks)</Label>
                <select
                  id="state"
                  value={draft.state ?? ""}
                  onChange={(e) => update("state", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Not set</option>
                  {STATE_CUISINES.map((s) => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  We recommend famous dishes from your state that cover your weakest nutrients.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Assigned sex at birth</Label>
              <RadioGroup value={draft.sex} onValueChange={(v) => update("sex", v as Profile["sex"])} className="grid grid-cols-2 gap-3">
                {(["female", "male"] as const).map((s) => (
                  <label key={s} htmlFor={`sex-${s}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem id={`sex-${s}`} value={s} />
                    <span className="capitalize text-sm">{s}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Gender identity</Label>
              <RadioGroup value={draft.gender} onValueChange={(v) => update("gender", v as Profile["gender"])} className="grid grid-cols-2 gap-3">
                {([["cis", "Cisgender"], ["trans", "Transgender"]] as const).map(([v, l]) => (
                  <label key={v} htmlFor={`g-${v}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem id={`g-${v}`} value={v} />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                <div>
                  <div className="text-sm font-medium">Active HRT</div>
                  <div className="text-xs text-muted-foreground">Hormone Replacement Therapy</div>
                </div>
                <Switch checked={draft.hrt} onCheckedChange={(v) => update("hrt", v)} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                <div>
                  <div className="text-sm font-medium">Currently menstruating</div>
                  <div className="text-xs text-muted-foreground">Affects iron baseline</div>
                </div>
                <Switch checked={draft.menstruating} onCheckedChange={(v) => update("menstruating", v)} />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={() => { setSaved(draft); toast.success("Profile saved", { description: "RDA targets updated across the app." }); }}
                className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
                <Save className="mr-2 h-4 w-4" />Save profile
              </Button>
              <Button variant="ghost" onClick={() => setDraft(saved)}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Live RDA targets</CardTitle>
            <CardDescription>Recalculated as you adjust inputs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MINERALS.map((m) => (
              <div key={m} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: MINERAL_META[m].color }} />
                  <span className="font-medium">{MINERAL_META[m].label}</span>
                </div>
                <Badge variant="secondary" className="tabular-nums text-sm">
                  {targets[m]} {MINERAL_META[m].unit}/day
                </Badge>
              </div>
            ))}
            <div className="rounded-xl border border-border/40 bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground">
              <p><span className="font-medium text-foreground">Calcium</span> 1300 mg for teens (&lt;19) and seniors (&gt;60), else 1000 mg.</p>
              <p className="mt-1"><span className="font-medium text-foreground">Iron</span> 18 mg for menstruating cis-female or trans-masc (no HRT), else 8 mg.</p>
              <p className="mt-1"><span className="font-medium text-foreground">Magnesium</span> adjusted by sex & HRT.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /> Premium — Care Bridge</CardTitle>
          <CardDescription>Preview the doctor-share flow: PDF reports, telehealth stub, deficiency alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
            <div>
              <div className="text-sm font-medium">Premium features</div>
              <div className="text-xs text-muted-foreground">Enables Doctor-ready PDF export & telehealth requests on the Reports page.</div>
            </div>
            <Switch checked={premium} onCheckedChange={setPremium} />
          </label>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> The Nutri Health AI voice</CardTitle>
          <CardDescription>How we talk to you across notifications, streaks, and nudges.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {VOICE.styleGuidePrinciples.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[VOICE.notif.lowIron, VOICE.notif.lowD, VOICE.notif.goodJob].map((t) => (
              <div key={t} className="rounded-xl border border-border/40 bg-background/40 p-3 text-xs italic text-foreground/80">"{t}"</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}