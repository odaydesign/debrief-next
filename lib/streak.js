"use client";

import { useMemo } from "react";
import { useMain } from "@/lib/MainContext";

// Device-local YYYY-MM-DD — consistent with how the feed buckets "today".
export const localDateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/**
 * Reading streak from userInteractions readAt timestamps: consecutive days
 * with at least one read, counting back from today — or from yesterday, so
 * the streak isn't shown as broken before today's edition has been read.
 *
 * Returns { days, readToday }.
 */
export function computeStreak(interactions, now = new Date()) {
  const readDays = new Set(
    (interactions || [])
      .filter((i) => i.readAt)
      .map((i) => localDateKey(new Date(i.readAt)))
  );

  const today = localDateKey(now);
  const readToday = readDays.has(today);

  const cursor = new Date(now);
  if (!readToday) cursor.setDate(cursor.getDate() - 1); // yesterday-grace

  let days = 0;
  while (readDays.has(localDateKey(cursor))) {
    days += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { days, readToday };
}

export function useStreak() {
  const { interactions } = useMain();
  return useMemo(() => computeStreak(interactions), [interactions]);
}
