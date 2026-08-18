import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ACTIVITY_META, useProfile, type ActivityLevel, type Profile } from "@/lib/nutrition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Leaf } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Nutri Health AI" }] }),
  component: Onboarding,
});

const GOALS = [
  { v: "lose", label: "Lose fat", emoji: "⚡" },
  { v: "maintain", label: "Maintain", emoji: "⚖️" },
  { v: "gain", label: "Gain muscle", emoji: "💪" },
  { v: "athletic", label: "Athletic performance", emoji: "🏃" },
] as const;

function Onboarding() {
  const [saved, setSaved] = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const steps = ["Welcome", "Basics", "Body", "Activity", "Goal"];
  const total = steps.length;

  const up = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    const finalProfile: Profile = { ...draft, complete: true };
    setSaved(finalProfile);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").upsert({
          user_id: user.id,
          name: finalProfile.name,
          age: finalProfile.age,
          sex: finalProfile.sex,
          gender: finalProfile.gender,
          hrt: finalProfile.hrt,
          menstruating: finalProfile.menstruating,
          weight_kg: finalProfile.weightKg,
          height_cm: finalProfile.heightCm ?? 170,
          activity: finalProfile.activity,
          dietary_goal: finalProfile.dietaryGoal ?? "maintain",
          onboarded: true,
        }, { onConflict: "user_id" });
      }
    } catch (e) { console.warn("profile sync skipped", e); }
    toast.success("You're all set!", { description: "Personalised targets are ready." });
    navigate({ to: "/" });
  };

  const canProceed = useMemo(() => {
    if (step === 1) return draft.name.trim().length > 1 && draft.age >= 1;
    if (step === 2) return draft.weightKg >= 20 && (draft.heightCm ?? 0) >= 80;
    return true;
  }, [step, draft]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <Card className="relative w-full max-w-xl border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Step {step + 1} / {total}</div>
          </div>
          <div className="mb-2 flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "liquid-fill" : "bg-border"}`} />
            ))}
          </div>
          <CardTitle className="text-2xl">{steps[step] === "Welcome" ? "Let's personalise your targets" : steps[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "We'll calibrate vitamin and mineral RDAs to your body in under a minute."}
            {step === 1 && "Your name and age."}
            {step === 2 && "Height & weight scale electrolyte and protein targets."}
            {step === 3 && "Activity level adjusts magnesium, potassium and protein."}
            {step === 4 && "Pick a goal — you can change it anytime."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-sm">
              <p>You'll get a high-fidelity dashboard with <span className="font-medium text-primary">36 nutrients</span> tracked, AI photo & text logging, weekly deficiency tracking and food suggestions tuned to your demographics.</p>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full name</Label><Input value={draft.name} onChange={(e) => up("name", e.target.value)} placeholder="Alex Rivera" /></div>
                <div className="space-y-2"><Label>Age</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={draft.age === 0 ? "" : String(draft.age)} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); if (v === "") return up("age", 0); up("age", Math.min(120, parseInt(v, 10))); }} /></div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Assigned sex at birth</Label>
                <RadioGroup value={draft.sex} onValueChange={(v) => up("sex", v as Profile["sex"])} className="grid grid-cols-2 gap-3">
                  {(["female", "male"] as const).map((s) => (
                    <label key={s} htmlFor={`s-${s}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                      <RadioGroupItem id={`s-${s}`} value={s} /><span className="capitalize text-sm">{s}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              {draft.sex === "female" && (
                <>
                  <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3 sm:col-span-1">
                    <div><div className="text-sm font-medium">Menstruating</div><div className="text-xs text-muted-foreground">Iron RDA → 18mg</div></div>
                    <Switch checked={draft.menstruating} onCheckedChange={(v) => up("menstruating", v)} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3 sm:col-span-1">
                    <div><div className="text-sm font-medium">On HRT</div><div className="text-xs text-muted-foreground">Hormone therapy</div></div>
                    <Switch checked={draft.hrt} onCheckedChange={(v) => up("hrt", v)} />
                  </label>
                </>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Height (cm)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={(draft.heightCm ?? 0) === 0 ? "" : String(draft.heightCm)} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); if (v === "") return up("heightCm", 0); up("heightCm", Math.min(230, parseInt(v, 10))); }} /></div>
              <div className="space-y-2"><Label>Weight (kg)</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={draft.weightKg === 0 ? "" : String(draft.weightKg)} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); if (v === "") return up("weightKg", 0); up("weightKg", Math.min(250, parseInt(v, 10))); }} /></div>
            </div>
          )}
          {step === 3 && (
            <RadioGroup value={draft.activity} onValueChange={(v) => up("activity", v as ActivityLevel)} className="grid gap-2">
              {(Object.keys(ACTIVITY_META) as ActivityLevel[]).map((a) => (
                <label key={a} htmlFor={`a-${a}`} className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem id={`a-${a}`} value={a} />
                    <div>
                      <div className="text-sm font-medium">{ACTIVITY_META[a].label}</div>
                      <div className="text-xs text-muted-foreground">{ACTIVITY_META[a].desc}</div>
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">×{ACTIVITY_META[a].mult.toFixed(2)}</span>
                </label>
              ))}
            </RadioGroup>
          )}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button key={g.v} onClick={() => up("dietaryGoal", g.v)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                    draft.dietaryGoal === g.v
                      ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                      : "border-border/60 bg-background/40 hover:border-primary/50"
                  }`}>
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-sm font-medium">{g.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={back} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            {step < total - 1 ? (
              <Button onClick={next} disabled={!canProceed} className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
                Continue<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
                <Check className="mr-2 h-4 w-4" />Start tracking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}