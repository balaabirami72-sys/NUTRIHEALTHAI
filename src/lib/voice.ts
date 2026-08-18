// Nutri Health AI voice — warm, empathetic microcopy. Second person, never shaming,
// metric first + feeling second. Max 1 emoji per line.

import type { Mineral } from "./nutrition";
import { MINERAL_META } from "./nutrition";

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const VOICE = {
  greetings: {
    morning: ["Good morning", "Rise & shine", "Morning, sunshine", "Fresh start"],
    afternoon: ["Good afternoon", "Midday check-in", "Hey there", "Hi again"],
    evening: ["Good evening", "Winding down", "Evening, friend", "Almost bedtime"],
  },
  emptyState: [
    "A blank plate is a fresh start — what did you fuel up with today?",
    "No meals logged yet. Your body's waiting for its first hello 🌱",
    "Even a snack counts. Log the little wins.",
  ],
  streak: {
    starting: "One day in — nice. Momentum starts here.",
    building: (d: number) => `${d} days strong. Your future self says thanks.`,
    onFire: (d: number) => `${d}-day streak 🔥 you're glowing.`,
  },
  celebration: (mineral: Mineral, pct: number) =>
    `Nice — that's +${Math.round(pct)}% of your daily ${MINERAL_META[mineral].label.toLowerCase()} ${pct > 50 ? "🌟" : "🌱"}`,
  deficit: (mineral: Mineral, pct: number) =>
    pct < 40
      ? `${MINERAL_META[mineral].label} is running low (${Math.round(pct)}%). Let's find you a boost.`
      : `${MINERAL_META[mineral].label} at ${Math.round(pct)}% — a tweak away from on-track.`,
  scanSuccess: (mineral: Mineral) => pick([
    `Logged 🌿 Your ${MINERAL_META[mineral].label.toLowerCase()} thanks you.`,
    `In the books. Your body just got a bit more of what it loves.`,
    `That plate mattered. Rings updated.`,
  ]),
  notif: {
    lowIron: "Feeling drained? Your iron's been quiet this week. A lentil bowl could help 🌿",
    lowD: "Sunlight break? Vitamin D is low — even 15 min helps your bones & mood ☀️",
    goodJob: "You hit every target today. That's rare. Enjoy the evening 💚",
  },
  styleGuidePrinciples: [
    "Second person, always. We speak with you, not at you.",
    "Warm, never shaming. Low iron isn't a failure — it's a nudge.",
    "Metric first, feeling second. Numbers ground the encouragement.",
    "At most one emoji per line. Sparingly, like seasoning.",
    "Celebrate small wins louder than we flag gaps.",
  ],
};

export function greetingForNow(name?: string) {
  const h = new Date().getHours();
  const bucket = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  const base = pick(VOICE.greetings[bucket]);
  return name ? `${base}, ${name.split(" ")[0]}` : base;
}

export function pickEmpty() {
  return pick(VOICE.emptyState);
}