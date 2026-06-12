"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { FadeInCard, CardContent } from "@/components/FeedMasonryComponents";
import { useDailySummary } from "@/lib/dailySummary";

// ─── Editorial single-column list (index 0 = hero) ───────────────────────────
export const EditorialList = ({ articles, onArticleClick }) => (
  <div className="w-full flex justify-center px-4">
    <div className="w-full max-w-[640px] flex flex-col gap-4">
      {articles.map((a, i) => (
        <FadeInCard key={a._id || a.id || i} index={i} onClick={() => onArticleClick(a)}>
          <div className="pointer-events-none h-full w-full">
            <CardContent data={a} featured={i === 0} />
          </div>
        </FadeInCard>
      ))}
    </div>
  </div>
);

// ─── Edition helpers ──────────────────────────────────────────────────────────
export const editionNo = (date) => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000); // day-of-year as a stable edition number
};

export const totalMinutes = (articles) => {
  const sum = articles.reduce((acc, a) => {
    const m = parseInt(String(a.readTime || '').match(/\d+/)?.[0] || '0', 10);
    return acc + (m || 0);
  }, 0);
  return sum || articles.length * 3;
};

// Turn a Title-Case headline into a flowing clause. Keeps acronyms / words
// with digits (GPT-6, AI) intact; lowercases ordinary words. `lead` keeps the
// first word's original capitalisation (used for the opening clause).
const clauseCase = (title, lead) => {
  return String(title)
    .replace(/[.!?]+$/, '')
    .split(/\s+/)
    .map((w, i) => {
      const keep = /[0-9]/.test(w) || (w.length <= 4 && w === w.toUpperCase());
      if (keep) return w;
      if (i === 0 && lead) return w;
      return w.charAt(0).toLowerCase() + w.slice(1);
    })
    .join(' ');
};

// Build a short, sharp "today's news" summary by weaving the day's top
// headlines into one sentence. Returns { ink, tail } for a two-tone render
// (tail = the final clause, shown muted). Falls back gracefully.
const summaryParts = (articles) => {
  const titles = articles.map((a) => a.title).filter(Boolean);
  if (titles.length === 0) return { ink: 'Dagens viktigaste nyheter', tail: null };

  const picked = [];
  let len = 0;
  for (const t of titles) {
    if (picked.length >= 3) break;
    if (picked.length && len + t.length > 78) break;
    picked.push(t);
    len += t.length;
  }

  const clauses = picked.map((t, i) => clauseCase(t, i === 0));
  if (clauses.length === 1) return { ink: clauses[0], tail: null };
  return { ink: clauses.slice(0, -1).join(', '), tail: clauses[clauses.length - 1] };
};

// ─── Editorial masthead (per day) ────────────────────────────────────────────
export const Masthead = ({ date, articles, onBack }) => {
  const count = articles.length;
  const min = totalMinutes(articles);
  const dateLabel = date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const aiSummary = useDailySummary(date, articles);
  const { ink, tail } = summaryParts(articles);

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-16 pb-9">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors mb-5 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Tillbaka
        </button>
      ) : (
        <span className="font-serif text-base font-semibold tracking-tight block mb-3">Debrief</span>
      )}

      <p className="kicker mb-3">Edition №{editionNo(date)} · {dateLabel}</p>

      <h1 className="font-serif font-semibold text-[1.95rem] md:text-[2.6rem] leading-[1.08] tracking-tight">
        {aiSummary
          ? aiSummary
          : <>{ink}{tail ? <> och <span className="text-muted">{tail}.</span></> : '.'}</>}
      </h1>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-5">
        <span className="meta">{count} {count === 1 ? 'brief' : 'briefer'}</span>
        <span className="meta">{min} min</span>
        <span className="meta" style={{ color: 'var(--accent)' }}>Handplockat</span>
      </div>
    </div>
  );
};

// ─── Day layout — header + list, used for opened days ────────────────────────
export const DayMagazineLayout = ({ articles, onArticleClick, date, onClose }) => {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Masthead date={date} articles={articles} onBack={onClose} />

      {articles.length === 0 ? (
        <div className="px-5 py-20 text-center text-muted">
          Inga artiklar publicerade denna dag.
        </div>
      ) : (
        <main className="pt-6 pb-24">
          <EditorialList articles={articles} onArticleClick={onArticleClick} />
        </main>
      )}
    </div>
  );
};
