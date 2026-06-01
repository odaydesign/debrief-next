"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/**
 * Lazy, cached daily editorial summary.
 *
 * Reads editions/{date} from Firestore; on a cache miss, asks the
 * /api/daily-summary route to generate one (OpenAI, server-side key),
 * renders it, and writes it back to the cache so it's generated once per day.
 * Returns null until a summary is available (caller falls back meanwhile).
 */
export function useDailySummary(date, articles) {
  const [summary, setSummary] = useState(null);
  const key = date ? dateKey(date) : null;
  const n = articles?.length || 0;

  useEffect(() => {
    if (!key || n === 0) return;
    let cancelled = false;
    setSummary(null);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "editions", key));
        if (snap.exists() && snap.data().summary) {
          if (!cancelled) setSummary(snap.data().summary);
          return;
        }

        const res = await fetch("/api/daily-summary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            date: key,
            articles: articles.slice(0, 10).map((a) => ({
              title: a.title,
              summary: a.summary || a.description || "",
            })),
          }),
        });
        if (!res.ok) return;
        const { summary: s } = await res.json();
        if (s && !cancelled) {
          setSummary(s);
          try {
            await setDoc(doc(db, "editions", key), { summary: s, createdAt: Date.now() }, { merge: true });
          } catch {
            /* cache write is best-effort */
          }
        }
      } catch {
        /* fall back to the stitched-headline summary */
      }
    })();

    return () => { cancelled = true; };
  }, [key, n]);

  return summary;
}
