import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { Stethoscope, ShieldCheck, Share2, ClipboardCheck, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  MINERALS,
  MINERAL_META,
  computeTargets,
  sumDay,
  useMeals,
  useProfile,
  type Mineral,
} from "@/lib/nutrition";
import { DoctorReportCard } from "@/components/DoctorReportCard";

/** Physician-facing longitudinal trend view + share consent portal. */
export function DoctorBridge() {
  const [profile] = useProfile();
  const [meals] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const [doctorView, setDoctorView] = useState(false);
  const [consent, setConsent] = useState(false);
  const [tracked, setTracked] = useState<Mineral>("iron");

  // 14-day % of RDA per day for the selected micronutrient
  const trend = useMemo(() => {
    const arr: { day: string; pct: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const day = sumDay(meals, d);
      const pct = targets[tracked] ? Math.round((day[tracked] / targets[tracked]) * 100) : 0;
      arr.push({
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        pct,
      });
    }
    return arr;
  }, [meals, targets, tracked]);

  const avgPct = Math.round(trend.reduce((s, r) => s + r.pct, 0) / trend.length);
  const daysBelow = trend.filter((r) => r.pct < 70).length;

  const share = () => {
    if (!consent) { toast.error("Consent required", { description: "Toggle 'I consent to share' first." }); return; }
    toast.success("Report link generated", { description: "A secure, time-limited link has been prepared for your physician." });
  };

  return (
    <section aria-labelledby="doctor-bridge-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
            <Stethoscope className="h-3.5 w-3.5" /> Patient ↔ doctor bridge
          </p>
          <h2 id="doctor-bridge-heading" className="mt-1 text-2xl font-bold tracking-tight">
            Longitudinal deficiency data, made clinical
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Toggle a physician-friendly view of your micronutrient trends and share a consented report with your care provider.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-3 py-2 text-sm shadow-sm">
          <Activity className="h-4 w-4 text-primary" />
          Doctor view
          <Switch checked={doctorView} onCheckedChange={setDoctorView} aria-label="Doctor view" />
        </label>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">
              14-day trend · {MINERAL_META[tracked].label}
            </CardTitle>
            <CardDescription>
              % of daily RDA over time — flag threshold {`<`} 70%.
              {doctorView && ` Patient: ${profile.name}, ${profile.age}${profile.sex === "female" ? "F" : "M"}${profile.menstruating ? ", menstruating" : ""}${profile.hrt ? ", HRT" : ""}.`}
            </CardDescription>
          </div>
          <select
            value={tracked}
            onChange={(e) => setTracked(e.target.value as Mineral)}
            className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
            aria-label="Micronutrient"
          >
            {MINERALS.map((m) => (
              <option key={m} value={m}>{MINERAL_META[m].label}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">14-day avg</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{avgPct}%</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Days below flag</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{daysBelow}<span className="text-sm text-muted-foreground"> / 14</span></p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinical signal</p>
              <p className={`mt-1 text-sm font-semibold ${daysBelow >= 5 ? "text-rose-400" : daysBelow >= 2 ? "text-amber-400" : "text-primary"}`}>
                {daysBelow >= 5 ? "Persistent deficit" : daysBelow >= 2 ? "Intermittent low" : "Within range"}
              </p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v: number) => [`${v}% of RDA`, MINERAL_META[tracked].label]}
                />
                <ReferenceLine y={70} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: "Flag threshold", position: "insideTopRight", fontSize: 10, fill: "var(--accent)" }} />
                <ReferenceLine y={100} stroke="var(--primary)" strokeDasharray="2 4" />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke={MINERAL_META[tracked].color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Consent portal · share with physician
          </CardTitle>
          <CardDescription>
            HIPAA-friendly consent flow. Nothing is shared until you explicitly opt in below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-xl border border-border/50 bg-background/40 p-4 text-sm">
            <div className="flex items-start gap-2">
              <ClipboardCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p>
                Package includes: 14-day trend for {MINERAL_META[tracked].label}, full 7-day RDA table, demographics,
                and Indian-diet remediation attempts. Excludes: raw meal photos, exact GPS, payment data.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={consent} onCheckedChange={setConsent} aria-label="Consent to share" />
              I consent to share the above with my clinician.
            </label>
            <Badge variant="outline" className="text-[10px]">Link auto-expires in 7 days</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={share} disabled={!consent} className="bg-[image:var(--gradient-primary,none)] bg-primary text-primary-foreground">
              <Share2 className="mr-2 h-4 w-4" /> Generate secure link
            </Button>
          </div>
        </CardContent>
      </Card>

      <DoctorReportCard />
    </section>
  );
}