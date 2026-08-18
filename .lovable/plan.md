# Nutri Health AI — Warm, Gamified Nutrition Companion

A single build pass that layers the requested product pillars on top of the existing Nutri Health AI app. Nothing on the backend/auth side changes — this is a UI, content, and one new report route.

## 1. Brand refresh: "Nutri Health AI"
- New wordmark + tagline: *"Feed the parts of you that keep you going."*
- Warmer palette accents (keep existing dark base): peach `#FFB199`, mint `#7DE3B0`, lilac `#C9B6FF` as mineral highlight tones.
- Update root `<title>`, meta, sidebar logo label, auth/onboarding hero copy.

## 2. User journey (baked into the UI, not just docs)
1. **Welcome / onboarding** — friendly 3-step (already exists) + a new final "meet your body map" teaser card.
2. **Daily dashboard** — today's meals up top (already done) + a new *"Your body today"* mini-map card that pulses the 2 lowest-mineral regions.
3. **Scan / log meal** — existing flow, add a celebratory toast ("Nice — that's +38% of your daily iron 🌱").
4. **Body Map screen (new)** — full-screen interactive human silhouette.
5. **Reports** — existing weekly view + new **"Care Bridge"** section: if any mineral <50% for 7+ days, surface a *"Share with your doctor"* CTA that opens a PDF.
6. **Profile** — add "Premium" toggle (local flag, no billing) to preview the doctor-share features.

## 3. New screens & components

### A. Interactive Body Map — `/body`
- New route `src/routes/body.tsx`.
- SVG human silhouette (front view) with named regions: `bones`, `teeth`, `heart`, `muscles`, `brain`, `thyroid`, `blood`, `skin`, `nerves`, `gut`, `immune`, `eyes`.
- Mineral → regions map in `src/lib/body-map.ts` (e.g. calcium → bones/teeth/heart/muscles; iron → blood/brain/muscles; vitamin D → bones/immune/mood; magnesium → muscles/nerves/heart; zinc → immune/skin; iodine → thyroid; B12 → nerves/blood; vitamin A → eyes/skin; vitamin C → skin/immune; potassium → heart/muscles).
- Left rail: chip list of minerals (color-coded). Selecting one:
  - Glowing pulse animation on relevant SVG regions (CSS `filter: drop-shadow` + framer-motion).
  - Right panel shows: *why this nutrient matters here* (1-liner per region) + *foods that help* (reuse `SUGGESTIONS` from `nutrition.ts`, extended).
- Tap a region → bottom sheet with region name, the nutrients it depends on, and the user's current % for each (from today's totals).
- Deficiency overlay toggle: paint regions red/amber/green based on user's 7-day intake vs target.

### B. Care Bridge / Doctor PDF
- New component `DoctorReportCard` inside `/reports`.
- Detects "severe deficiency" = any mineral <50% of target across last 7 days.
- Buttons: **Download PDF**, **Share with doctor** (uses `navigator.share` if available, else copies a summary), **Book telehealth** (opens a stub modal — no real booking).
- PDF via `jspdf` + `jspdf-autotable` (client-side): patient snapshot (name, age, sex, HRT/menstruating flags), 7-day intake table per mineral with % of RDA, flagged deficits, food suggestions, generated date. Clean typography, Nutri Health AI header, disclaimer footer.

### C. Dashboard "Body today" mini-card
- Small SVG silhouette that dims regions tied to the user's 2 weakest minerals. Tap → navigates to `/body` with that mineral preselected.

## 4. Playful copywriting layer
- New `src/lib/voice.ts` — central pool of empathetic microcopy: greetings, streak nudges, deficiency notes, celebration lines, empty states.
- Rules: second person, warm, never shaming; emoji sparingly (max 1 per line); metric first, feeling second (*"Iron at 42% — let's find you some lentils 🌱"*).
- Wired into: dashboard greeting, empty meal state, scanner success toast, reports deficit cards, streak badge.
- Also exported as a small **Style Guide** section rendered in `/profile` under "About Nutri Health AI voice" so it's visible in-app.

## 5. Navigation
- Add "Body Map" entry to `AppSidebar` between Dashboard and Reports (icon: `PersonStanding` from lucide).
- Add "Premium" badge next to Reports when premium flag on.

## Technical notes
- Body silhouette: hand-authored inline SVG in a new `src/components/BodySilhouette.tsx` with named `<g id="region-*">` groups; regions accept `active`, `intensity` (0–1), and `tone` props. Front view only for v1.
- Animation: `framer-motion` (already used elsewhere) for region pulse; respect `prefers-reduced-motion`.
- PDF: `bun add jspdf jspdf-autotable`.
- Premium flag: `localStorage` boolean via a `usePremium()` hook — no billing wiring in this pass.
- All colors go through existing semantic tokens in `src/styles.css`; new peach/mint/lilac added there as `--accent-warm`, `--accent-mint`, `--accent-lilac`.
- No schema changes, no server function changes, no auth changes.

## Out of scope (call out for a later pass)
- Real telehealth booking / provider directory.
- Back view of body / organ-level 3D.
- Server-side PDF generation or emailing the report.
- Real Stripe premium tier.

Approve and I'll build it in one pass.
