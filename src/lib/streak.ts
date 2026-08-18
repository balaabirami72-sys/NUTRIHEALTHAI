import { useMemo } from "react";
import type { Meal } from "./nutrition";

function dayKey(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export function computeStreak(meals: Meal[]): { current: number; best: number; loggedToday: boolean } {
  const set = new Set(meals.map((m) => dayKey(new Date(m.loggedAt))));
  const today = dayKey(new Date());
  const loggedToday = set.has(today);

  // current streak: start from today (or yesterday if not logged yet today)
  let cursor = new Date();
  if (!loggedToday) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (set.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best across last 90 days
  let best = 0;
  let run = 0;
  const probe = new Date();
  probe.setDate(probe.getDate() - 89);
  for (let i = 0; i < 90; i++) {
    if (set.has(dayKey(probe))) {
      run++;
      if (run > best) best = run;
    } else run = 0;
    probe.setDate(probe.getDate() + 1);
  }
  best = Math.max(best, current);
  return { current, best, loggedToday };
}

export function useStreak(meals: Meal[]) {
  return useMemo(() => computeStreak(meals), [meals]);
}