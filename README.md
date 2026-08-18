# Mineral Buddy

Create a high-fidelity, mobile-responsive web application named "NutriLog" that acts as an AI Mineral Tracker & Analytics Dashboard. 

The application must be designed with a premium, modern dark-mode aesthetic (using Slate-950 background, rounded corners, sleek typography, and Emerald/Teal accents). It must contain the following core screens and interactive features:

1. Navigation Sidebar:
   - Daily Dashboard
   - AI Meal Scanner
   - Weekly Deficits & Reports
   - Profile & RDA Targets

2. Profile & Demographic Configuration (Dynamic RDA Calculation):
   - Inputs for: Full Name, Age, Assigned Sex at Birth (Male/Female), Gender Identity (Cisgender/Transgender), Active Hormone Replacement Therapy (HRT) Toggle, and Menstruating Toggle.
   - Clinical target calculation logic:
     * Calcium Target: Standard is 1000mg. Adjust to 1300mg for Teens (<19) and Seniors (>60).
     * Iron Target: Standard is 8mg. Adjust to 18mg for menstruating individuals (Cisgender Females or Trans-masculine individuals still menstruating). If a Transgender Male is on HRT and not menstruating, baseline should drop to 8mg.
     * Magnesium Target: Standard is 400mg for males, 310-320mg for females (adjusted dynamically based on biological sex and HRT status).
     * Potassium Target: 3500mg.
     * Zinc Target: 11mg for males, 8mg for females.

3. AI Meal Scanner with interactive Clarifying Q&A Flow:
   - File upload area designed to trigger mobile camera capture natively.
   - Interactive multi-step wizard:
     * Step 1: Upload plate image.
     * Step 2: "AI Clarifying Questions" form. Before calculating, the AI agent must ask questions: "Was this cooked in butter or oil?", "Did you add table salt/seasoning?", and "Is this a standard, small, or large portion size?".
     * Step 3: Analysis state with a smooth spinning loader.
     * Step 4: Output displaying identified foods (e.g., "Spinach (150g)", "Grilled Chicken (100g)"), extracted minerals (Calcium, Iron, Magnesium, Zinc, Potassium), and prep notes.

4. Daily Progress Dashboard:
   - Display circular progress rings for the 5 key minerals. 
   - Each progress ring should dynamically calculate the percentage completed based on the current user's profile targets (e.g. 8.5mg iron logged of an 18mg female target = 47%).

5. 7-Day Weekly Deficit Report:
   - An interactive bar chart comparing daily mineral intake over the last 7 days against calculated weekly limits (daily target * 7).
   - Clear warning boxes for "Missed Minerals" displaying deep deficits.
   - "Demographic-Specific Food Suggestions" providing actionable, bioavailable local foods to fix deficits (e.g. if Iron is missed, suggest Amaranth leaves, spinach, pumpkin seeds; if Calcium is missed, suggest Ragi/Finger millet, paneer, sesame seeds).

Make the app completely functional with interactive mock data so I can click, test different genders, ages, and HRT settings, upload files, answer the Q&A, and log meals instantly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nutrilog-peace-life.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c8cd5f4c-85f0-47db-812e-d3269022a359).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
