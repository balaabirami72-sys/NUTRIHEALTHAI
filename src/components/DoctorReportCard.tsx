import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Stethoscope, FileDown, Share2, Video, Sparkles, Lock } from "lucide-react";
import { MINERALS, MINERAL_META, SUGGESTIONS, computeTargets, sumDay, useMeals, useProfile, type Mineral } from "@/lib/nutrition";
import { usePremium } from "@/lib/premium";
import { toast } from "sonner";

export function DoctorReportCard() {
  const [profile] = useProfile();
  const [meals] = useMeals();
  const targets = useMemo(() => computeTargets(profile), [profile]);
  const [premium] = usePremium();
  const [telehealthOpen, setTelehealthOpen] = useState(false);

  const { rows, severe } = useMemo(() => {
    const totals: Record<Mineral, number> = MINERALS.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<Mineral, number>);
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const day = sumDay(meals, d);
      for (const m of MINERALS) totals[m] += day[m];
    }
    const rows = MINERALS.map((m) => {
      const weekTarget = targets[m] * 7;
      const pct = weekTarget ? (totals[m] / weekTarget) * 100 : 0;
      return { mineral: m, intake: totals[m], target: weekTarget, pct };
    });
    const severe = rows.filter((r) => r.pct < 50);
    return { rows, severe };
  }, [meals, targets]);

  const downloadPdf = async () => {
    if (!premium) { toast.error("Premium required", { description: "Turn on premium in Profile to try the doctor report." }); return; }
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Header
    doc.setFillColor(15, 42, 60);
    doc.rect(0, 0, 595, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Nutri Health AI", 40, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("7-day nutrition report for your care provider", 40, 62);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), 40, 76);

    // Patient snapshot
    doc.setTextColor(20, 20, 25);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient snapshot", 40, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const meta = [
      `Name: ${profile.name}`,
      `Age: ${profile.age}`,
      `Sex at birth: ${profile.sex}${profile.gender === "trans" ? " (trans)" : ""}`,
      `HRT: ${profile.hrt ? "Yes" : "No"}   Menstruating: ${profile.menstruating ? "Yes" : "No"}`,
      `Weight: ${profile.weightKg} kg   Activity: ${profile.activity}`,
    ];
    meta.forEach((t, i) => doc.text(t, 40, 140 + i * 14));

    // Deficit summary
    if (severe.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(180, 40, 60);
      doc.text(`Flagged deficits (< 50% of 7-day RDA): ${severe.length}`, 40, 230);
      doc.setTextColor(20, 20, 25);
    }

    // Table
    autoTable(doc, {
      startY: 250,
      head: [["Nutrient", "7-day intake", "7-day target", "% of target", "Status"]],
      body: rows.map((r) => [
        MINERAL_META[r.mineral].label,
        `${r.intake.toFixed(1)} ${MINERAL_META[r.mineral].unit}`,
        `${r.target.toFixed(0)} ${MINERAL_META[r.mineral].unit}`,
        `${Math.round(r.pct)}%`,
        r.pct < 50 ? "Deficit" : r.pct < 80 ? "Low" : r.pct <= 120 ? "On track" : "High",
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 42, 60], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const v = String(data.cell.raw);
          if (v === "Deficit") data.cell.styles.textColor = [180, 40, 60];
          else if (v === "Low") data.cell.styles.textColor = [200, 130, 30];
          else if (v === "On track") data.cell.styles.textColor = [20, 130, 80];
        }
      },
    });

    // Suggestions for deficits
    if (severe.length) {
      let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Suggested food supports", 40, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      y += 16;
      for (const s of severe.slice(0, 6)) {
        doc.setFont("helvetica", "bold");
        doc.text(`${MINERAL_META[s.mineral].label}:`, 40, y);
        doc.setFont("helvetica", "normal");
        doc.text(SUGGESTIONS[s.mineral].join(", "), 130, y, { maxWidth: 420 });
        y += 18;
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Generated by Nutri Health AI. Educational information only — not a medical diagnosis. Please discuss with a qualified clinician before making treatment decisions.", 40, 800, { maxWidth: 515 });

    doc.save(`nutri-health-ai-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Report downloaded");
  };

  const shareWithDoctor = async () => {
    if (!premium) { toast.error("Premium required"); return; }
    const summary = `Nutri Health AI 7-day summary for ${profile.name}:\n` +
      severe.map((s) => `• ${MINERAL_META[s.mineral].label}: ${Math.round(s.pct)}% of 7-day RDA`).join("\n");
    if (navigator.share) {
      try { await navigator.share({ title: "Nutri Health AI nutrition report", text: summary }); }
      catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied", { description: "Paste it into your doctor's portal." });
    }
  };

  return (
    <>
      <Card className={`relative overflow-hidden border-border/60 bg-card/60 ${severe.length ? "border-primary/40 shadow-[var(--shadow-glow)]" : ""}`}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Care Bridge — share with your doctor
            {!premium && <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"><Lock className="h-3 w-3" /> Premium</span>}
          </CardTitle>
          <CardDescription>
            {severe.length
              ? `We noticed ${severe.length} nutrient${severe.length === 1 ? "" : "s"} tracking under 50% of your 7-day target. Package this into a clean PDF for your care provider.`
              : "Your 7-day intake looks steady — download an all-clear report anytime you want to share progress."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {severe.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {severe.map((s) => (
                <span key={s.mineral} className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">
                  {MINERAL_META[s.mineral].label} · {Math.round(s.pct)}%
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPdf} className="bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90">
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={shareWithDoctor}>
              <Share2 className="mr-2 h-4 w-4" /> Share with doctor
            </Button>
            <Button variant="ghost" onClick={() => setTelehealthOpen(true)}>
              <Video className="mr-2 h-4 w-4" /> Telehealth consult
            </Button>
          </div>
          {!premium && (
            <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
              Enable Premium in your Profile to try the doctor-share features.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={telehealthOpen} onOpenChange={setTelehealthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Telehealth consult</DialogTitle>
            <DialogDescription>
              We'll match you with a registered dietitian who can review your 7-day report and answer questions. This is a demo — real bookings coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="font-medium">Dr. Priya Menon, RD</div>
              <div className="text-xs text-muted-foreground">Deficiency &amp; hormone-informed nutrition · avg. 4.9★</div>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="font-medium">Dr. Marco Alvarez, MD</div>
              <div className="text-xs text-muted-foreground">Preventive medicine · telemedicine certified</div>
            </div>
          </div>
          <Button onClick={() => { toast.success("Request sent", { description: "We'll email confirmation shortly." }); setTelehealthOpen(false); }} className="bg-[image:var(--gradient-primary)] text-primary-foreground">
            Request a slot
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}