import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MINERAL_META, MINERALS, MEAL_TYPES, MEAL_TYPE_META, mealTypeFromDate, useMeals, type Meal, type MealType, type Mineral } from "@/lib/nutrition";
import { Camera, Upload, Check, ArrowLeft, ArrowRight, Sparkles, Type, ImagePlus, Activity } from "lucide-react";
import { toast } from "sonner";
import { AnalyzingState } from "@/components/AnalyzingState";
import { VOICE } from "@/lib/voice";
import { computeTargets, useProfile } from "@/lib/nutrition";

async function callAnalyzeApi(payload: {
  imageBase64?: string;
  mimeType?: string;
  text?: string;
  answers?: Array<{ label: string; value: string }>;
}) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to communicate with AI server');
  }

  return data;
}

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "AI Meal Scanner — Nutri Health AI" },
      { name: "description", content: "Snap a plate, answer clarifying questions, and log minerals instantly." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ mode: (s.mode === "text" || s.mode === "camera" || s.mode === "upload" ? s.mode : undefined) as "text" | "camera" | "upload" | undefined }),
  component: Scanner,
});

type Step = 1 | 2 | 3 | 4 | 5;
type EntryMode = "upload" | "text" | "camera";
type Question = { id: string; label: string; options: string[] };
type Identified = { name: string; foods: { name: string; grams: number }[]; questions: Question[] };

type Macros = { calories: number; protein: number; carbs: number; fat: number; fiber: number };

type ScanResult = {
  name: string;
  foods: { name: string; grams: number }[];
  minerals: Record<Mineral, number>;
  macros?: Macros;
  prepNotes: string;
  micronutrients?: Record<string, number>; // Added for full vitamin support
};

const DEMO_IDENTIFIED: Identified = {
  name: "Greens, Chicken & Grains Plate",
  foods: [
    { name: "Spinach", grams: 150 },
    { name: "Grilled Chicken", grams: 100 },
    { name: "Quinoa", grams: 120 },
    { name: "Sesame seeds", grams: 10 },
  ],
  questions: [
    { id: "q1", label: "Cooked with which oil or fat?", options: ["None / Steamed", "Olive oil", "Butter", "Ghee"] },
    { id: "q2", label: "How much oil was used in total?", options: ["Under 1 tsp", "1–2 tsp", "1 tbsp or more"] },
    { id: "q3", label: "How much salt / seasoning was added?", options: ["None", "Light", "Moderate", "Heavy"] },
    { id: "q4", label: "Portion size relative to standard?", options: ["Small snack", "Standard lunch/dinner", "Large portion"] },
    { id: "q5", label: "Any added dairy (cheese, milk, yogurt, cream)?", options: ["None", "A little (1-2 tbsp)", "Generous portion"] },
    { id: "q6", label: "Protein preparation method?", options: ["Skinless & Grilled", "Pan-fried with oil", "Deep fried", "Boiled/Poached"] },
    { id: "q7", label: "Was any sweet sauce or glaze added?", options: ["None", "Teriyaki / BBQ", "Honey / Sweet chili"] },
    { id: "q8", label: "Grain type or refining level?", options: ["Whole grain", "Refined white grain", "Low-carb swap"] },
  ],
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function Scanner() {
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<EntryMode>((search.mode as EntryMode) || "upload");
  const [textDesc, setTextDesc] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [identified, setIdentified] = useState<Identified | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(mealTypeFromDate(new Date()));
  const [, addMeal] = useMeals();
  const [profile] = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { if (search.mode) setMode(search.mode as EntryMode); }, [search.mode]);

  const onFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScanError(null);
    setStep(2);
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);

      const [header, base64Data] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || file.type || 'image/jpeg';

      const r = await callAnalyzeApi({
        imageBase64: base64Data,
        mimeType,
      });

      setIdentified(r);
      setAnswers({});
      setOtherText({});
      setStep(3);
    } catch (err) {
      console.error(err);
      setScanError(err instanceof Error ? err.message : "Couldn't analyze the photo");
      toast.error("Couldn't analyze the photo", { description: "Try again with a clearer image." });
      setStep(1);
    }
  };

  const onText = async () => {
    if (textDesc.trim().length < 3) { toast.error("Please describe your meal"); return; }
    setScanError(null);
    setStep(2);
    setImageUrl(null);
    setImageDataUrl(null);
    try {
      const r = await callAnalyzeApi({ text: textDesc.trim() });
      setIdentified(r);
      setAnswers({});
      setOtherText({});
      setStep(3);
    } catch (err) {
      console.error(err);
      setScanError(err instanceof Error ? err.message : "Couldn't analyze your description");
      toast.error("Couldn't analyze that meal");
      setStep(1);
    }
  };

  const useDemo = () => {
    setImageUrl(null);
    setImageDataUrl(null);
    setIdentified(DEMO_IDENTIFIED);
    setAnswers({});
    setOtherText({});
    setStep(3);
  };

  const resolvedAnswers = () =>
    (identified?.questions || []).map((q) => {
      const raw = answers[q.id];
      const value = raw === "__other__" ? (otherText[q.id]?.trim() || "Other") : (raw || "—");
      return { label: q.label, value };
    });

  const runCompute = async () => {
    if (!identified) return;
    setStep(4);
    setScanError(null);
    try {
      let base64Data: string | undefined;
      let mimeType: string | undefined;

      if (imageDataUrl) {
        const [header, data] = imageDataUrl.split(',');
        base64Data = data;
        mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      }

      const r = await callAnalyzeApi({
        imageBase64: base64Data,
        mimeType,
        text: textDesc || identified.name,
        answers: resolvedAnswers(),
      });

      // Extracts the micronutrients container regardless of how backend nests it
const rawMicros = r.micronutrients || r.mappedMicros || r.minerals || r;

const minerals = {} as Record<Mineral, number>;

for (const k of MINERALS) {
  const key = String(k).toLowerCase();

  const val = 
    rawMicros[k] ?? 
    rawMicros[key] ?? 
    
    // --- Vitamins ---
    (key === "vitamina" || key === "vita" ? (rawMicros.vitaminA ?? rawMicros.vitA ?? rawMicros.a) : undefined) ??
    (key === "vitaminc" || key === "vitc" ? (rawMicros.vitaminC ?? rawMicros.vitC ?? rawMicros.c) : undefined) ??
    (key === "vitamind" || key === "vitd" ? (rawMicros.vitaminD ?? rawMicros.vitD ?? rawMicros.d) : undefined) ??
    (key === "vitamine" || key === "vite" ? (rawMicros.vitaminE ?? rawMicros.vitE ?? rawMicros.e) : undefined) ??
    (key === "vitamink" || key === "vitk" ? (rawMicros.vitaminK ?? rawMicros.vitK ?? rawMicros.k_vit) : undefined) ??
    (key === "thiamin" || key === "thiamine" || key === "b1" ? (rawMicros.thiamin ?? rawMicros.thiamine ?? rawMicros.b1) : undefined) ??
    (key === "riboflavin" || key === "b2" ? (rawMicros.riboflavin ?? rawMicros.b2) : undefined) ??
    (key === "niacin" || key === "b3" ? (rawMicros.niacin ?? rawMicros.b3) : undefined) ??
    (key === "pantothenicacid" || key === "b5" ? (rawMicros.pantothenicAcid ?? rawMicros.pantothenic_acid ?? rawMicros.b5) : undefined) ??
    (key === "vitaminb6" || key === "b6" ? (rawMicros.vitaminB6 ?? rawMicros.b6) : undefined) ??
    (key === "folate" || key === "folicacid" || key === "b9" ? (rawMicros.folate ?? rawMicros.folicAcid ?? rawMicros.b9) : undefined) ??
    (key === "vitaminb12" || key === "b12" ? (rawMicros.vitaminB12 ?? rawMicros.b12) : undefined) ??
    
    // --- Minerals & Trace Elements ---
    (key === "calcium" ? (rawMicros.calcium ?? rawMicros.ca) : undefined) ??
    (key === "iron" ? (rawMicros.iron ?? rawMicros.fe) : undefined) ??
    (key === "magnesium" ? (rawMicros.magnesium ?? rawMicros.mg) : undefined) ??
    (key === "phosphorus" ? (rawMicros.phosphorus ?? rawMicros.p) : undefined) ??
    (key === "potassium" ? (rawMicros.potassium ?? rawMicros.k) : undefined) ??
    (key === "sodium" ? (rawMicros.sodium ?? rawMicros.na) : undefined) ??
    (key === "zinc" ? (rawMicros.zinc ?? rawMicros.zn) : undefined) ??
    (key === "copper" ? (rawMicros.copper ?? rawMicros.cu) : undefined) ??
    (key === "manganese" ? (rawMicros.manganese ?? rawMicros.mn) : undefined) ??
    (key === "selenium" ? (rawMicros.selenium ?? rawMicros.se) : undefined) ??
    (key === "fluoride" ? (rawMicros.fluoride ?? rawMicros.f) : undefined) ?? 
    0;

  minerals[k] = +Number(val).toFixed(1);
}

      setResult({
        name: r.name || identified.name,
        foods: r.foods || identified.foods,
        minerals,
        macros: r.macros,
        prepNotes: r.prepNotes || '',
      });
      setStep(5);
    } catch (err) {
      console.error(err);
      setScanError(err instanceof Error ? err.message : "Couldn't compute nutrients");
      toast.error("Couldn't compute nutrients", { description: "Please try again." });
      setStep(3);
    }
  };

  const logMeal = () => {
    if (!result) return;
    const meal: Meal = {
      id: `m-${Date.now()}`,
      name: result.name,
      loggedAt: new Date().toISOString(),
      foods: result.foods,
      minerals: result.minerals,
      prepNotes: result.prepNotes,
      mealType,
    };
    addMeal(meal);

    const targets = computeTargets(profile);
    let bestMineral: Mineral = "iron";
    let bestPct = 0;
    for (const k of MINERALS) {
      const pct = ((result.minerals[k] || 0) / (targets[k] || 1)) * 100;
      if (pct > bestPct) { bestPct = pct; bestMineral = k; }
    }
    toast.success(VOICE.scanSuccess(bestMineral), { description: VOICE.celebration(bestMineral, bestPct) });
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">AI Scanner</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Log a meal — your way.</h1>
      </header>

      <Stepper step={step} />

      {step === 1 && (
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-background/40 p-1">
              {([
                { v: "text", label: "Text", icon: Type },
                { v: "upload", label: "Upload", icon: ImagePlus },
                { v: "camera", label: "Camera", icon: Camera },
              ] as const).map((m) => (
                <button key={m.v} onClick={() => setMode(m.v as EntryMode)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    mode === m.v ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  <m.icon className="h-4 w-4" /> {m.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {mode === "text" && (
              <div className="space-y-3">
                <Label htmlFor="desc">Describe what you ate</Label>
                <Textarea id="desc" value={textDesc} onChange={(e) => setTextDesc(e.target.value)} rows={4} placeholder="e.g., Puri with potato masala and sambhar" className="bg-background/40" />
                <div className="flex flex-wrap gap-2">
                  {["2 eggs and avocado toast", "Bowl of dal with rice", "Grilled salmon, broccoli, sweet potato", "Puri with potato masala"].map((s) => (
                    <button key={s} onClick={() => setTextDesc(s)} className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">{s}</button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={onText} className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
                    Analyze<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {mode === "upload" && (
              <>
                <label htmlFor="plate" className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/70 bg-background/30 p-10 text-center transition hover:border-primary/60 hover:bg-primary/5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-medium">Tap to upload a photo</div>
                    <div className="text-xs text-muted-foreground">JPG/PNG up to 10MB</div>
                  </div>
                  <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); fileRef.current?.click(); }}>
                    <Upload className="mr-2 h-4 w-4" />Choose file
                  </Button>
                  <input ref={fileRef} id="plate" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                </label>
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  No food handy? <button className="text-primary underline-offset-4 hover:underline" onClick={useDemo}>Use a demo plate</button>
                </div>
              </>
            )}
            {mode === "camera" && <CameraCapture onCapture={onFile} />}
            {scanError && (
              <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{scanError}</div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <AnalyzingState image={imageUrl} label="Analyzing meal…" sub={imageUrl ? "Vision model is identifying ingredients & portions." : "Parsing your description into ingredients & portions."} />
      )}

      {step === 3 && identified && (
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Identified Food: {identified.name}</CardTitle>
            <CardDescription>Answer these questions ({identified.questions.length} total) so we can scale your nutrition accurately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {imageUrl && (
              <img src={imageUrl} alt="Uploaded plate" className="max-h-48 w-full rounded-xl border border-border/60 object-cover" />
            )}

            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Identified components</div>
              <div className="flex flex-wrap gap-2">
                {identified.foods.map((f) => (
                  <span key={f.name} className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-sm">
                    {f.name} <span className="text-muted-foreground">({f.grams}g)</span>
                  </span>
                ))}
              </div>
            </div>

            {scanError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{scanError}</div>
            )}

            {identified.questions.map((q, idx) => (
              <div key={q.id} className="space-y-2 border-t border-border/40 pt-4 first:border-none first:pt-0">
                <div className="text-xs font-semibold text-primary">Question {idx + 1} of {identified.questions.length}</div>
                <DynamicQ
                  q={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  other={otherText[q.id] || ""}
                  onOther={(v) => setOtherText((t) => ({ ...t, [q.id]: v }))}
                />
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
              <Button
                onClick={runCompute}
                disabled={identified.questions.some((q) => !answers[q.id])}
                className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
              >
                Calculate nutrition<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <AnalyzingState image={imageUrl} label="Calculating macros & minerals…" sub="Computing macro totals and micro distributions based on your intake." />
      )}

      {step === 5 && result && (
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {result.name}</CardTitle>
            <CardDescription>{result.prepNotes}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Log as</div>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt}
                    onClick={() => setMealType(mt)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition ${
                      mealType === mt
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-base">{MEAL_TYPE_META[mt].emoji}</span>
                    {MEAL_TYPE_META[mt].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Identified foods & estimated intake</div>
              <div className="flex flex-wrap gap-2">
                {result.foods.map((f) => (
                  <span key={f.name} className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-sm font-medium">
                    {f.name}: <span className="text-primary">{f.grams}g</span>
                  </span>
                ))}
              </div>
            </div>

            {result.macros && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Macronutrients
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Calories</div>
                    <div className="mt-1 text-base font-bold">{result.macros.calories} <span className="text-xs font-normal">kcal</span></div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Protein</div>
                    <div className="mt-1 text-base font-bold">{result.macros.protein}g</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Carbs</div>
                    <div className="mt-1 text-base font-bold">{result.macros.carbs}g</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Fat</div>
                    <div className="mt-1 text-base font-bold">{result.macros.fat}g</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-center">
                    <div className="text-xs text-muted-foreground">Fiber</div>
                    <div className="mt-1 text-base font-bold">{result.macros.fiber}g</div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Micronutrients & Minerals</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {MINERALS.map((k) => (
                  <div key={k} className="rounded-xl border border-border/50 bg-background/40 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: MINERAL_META[k].color }} />
                      {MINERAL_META[k].label}
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {result.minerals[k]?.toFixed(1) || 0} <span className="text-xs font-normal text-muted-foreground">{MINERAL_META[k].unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => { setStep(1); setImageUrl(null); setImageDataUrl(null); setResult(null); setIdentified(null); setAnswers({}); setOtherText({}); }}>Scan another</Button>
              <Button onClick={logMeal} className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
                <Check className="mr-2 h-4 w-4" />Add to log
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const labels = ["Upload", "Identify", "Clarify", "Calculate", "Result"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <div key={l} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums transition ${
              active ? "border-primary bg-primary text-primary-foreground" : done ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
            }`}>{done ? <Check className="h-3.5 w-3.5" /> : n}</div>
            <div className={`hidden text-xs uppercase tracking-wider sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>{l}</div>
            {i < labels.length - 1 && <div className={`h-px flex-1 ${done ? "bg-primary/60" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function DynamicQ({
  q,
  value,
  onChange,
  other,
  onOther,
}: {
  q: Question;
  value: string | undefined;
  onChange: (v: string) => void;
  other: string;
  onOther: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{q.label}</Label>
      <RadioGroup value={value ?? ""} onValueChange={onChange} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {q.options.map((opt) => (
          <label key={opt} htmlFor={`${q.id}-${opt}`} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem id={`${q.id}-${opt}`} value={opt} />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
        <label htmlFor={`${q.id}-other`} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
          <RadioGroupItem id={`${q.id}-other`} value="__other__" />
          <span className="text-sm">Other</span>
        </label>
      </RadioGroup>
      {value === "__other__" && (
        <Input
          autoFocus
          placeholder="Type your answer…"
          value={other}
          onChange={(e) => onOther(e.target.value)}
          className="bg-background/40"
        />
      )}
    </div>
  );
}

function CameraCapture({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        setStream(s);
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Camera unavailable");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);

  const snap = async () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stream?.getTracks().forEach((t) => t.stop());
      onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  if (err) {
    return (
      <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <div className="text-sm font-medium text-destructive">Camera unavailable</div>
        <div className="text-xs text-muted-foreground">{err}</div>
        <div className="text-xs text-muted-foreground">Switch to Upload mode or grant camera access in your browser.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-black">
        <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full object-cover sm:aspect-video" />
        <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-primary/50" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button onClick={snap} aria-label="Take picture" className="relative h-16 w-16 rounded-full border-4 border-white bg-white/90 transition hover:scale-105">
            <span className="absolute inset-2 rounded-full bg-[image:var(--gradient-primary)]" />
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">Position your plate inside the frame and tap the shutter.</p>
    </div>
  );
}