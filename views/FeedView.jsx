"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInCard, CardContent } from "@/components/FeedMasonryComponents";
import { useDailySummary } from "@/lib/dailySummary";
import { Layers, ArrowLeft } from 'lucide-react';

// ─── Date helpers ────────────────────────────────────────────────────────────
const getDateString = (dateObj) => {
  const d = new Date(dateObj);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const generateWeekStacks = (baseDate, articles) => {
  const stacks = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const targetDateStr = getDateString(d);
    const dayArticles = articles.filter(a => getDateString(a.date) === targetDateStr);
    stacks.push({ id: `stack-${d.toISOString()}`, date: d, articles: dayArticles });
  }
  return stacks;
};

// ─── Editorial single-column list (index 0 = hero) ───────────────────────────
const EditorialList = ({ articles, onArticleClick }) => (
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

// ─── Editorial masthead (per day) ────────────────────────────────────────────
const editionNo = (date) => {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000); // day-of-year as a stable edition number
};

const totalMinutes = (articles) => {
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

const Masthead = ({ date, articles, onBack }) => {
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

// ─── Day layout — header + list, used for opened stacks ──────────────────────
const DayMagazineLayout = ({ articles, onArticleClick, date, onClose }) => {
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

// ─── Single stack node (past days, clickable) ────────────────────────────────
const DailyStackNode = ({ stack, onOpen }) => {
  const stackCards = stack.articles.slice(0, 3).reverse();

  return (
    <div className="flex flex-col items-center justify-center p-6 py-16 min-h-[80vh] relative snap-center">
      <div className="absolute top-16 left-0 right-0 p-6 flex justify-center items-start pointer-events-none z-20">
        <div className="text-center">
          <h2 className="kicker mb-2">Dagens Samling</h2>
          <h1 className="text-4xl font-serif text-ink capitalize leading-none">
            {stack.date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h1>
        </div>
      </div>

      <motion.div
        className="relative w-full max-w-[340px] md:max-w-[400px] aspect-[3/4] perspective-1000 cursor-pointer mt-28 mb-8"
        onClick={() => onOpen(stack)}
        whileHover="hovered"
        initial="initial"
        animate="animate"
      >
        {stackCards.map((article, idx) => {
          const stackDepth = stackCards.length - idx - 1;
          const scale = 1 - stackDepth * 0.05;
          const yOffset = stackDepth * 25;
          const rotate = stackDepth % 2 === 0 ? stackDepth * 2 : stackDepth * -2;
          const zIndex = 50 - stackDepth;
          const isFront = stackDepth === 0;

          let hoverRotate = 0, hoverYOffset = yOffset - 20, hoverXOffset = 0;
          if (stackDepth === 1) { hoverYOffset = yOffset - 40; hoverRotate = -8; hoverXOffset = -30; }
          else if (stackDepth === 2) { hoverYOffset = yOffset - 50; hoverRotate = 8; hoverXOffset = 30; }

          return (
            <motion.div
              key={article.id || `stack-${idx}`}
              variants={{
                initial: { scale: 0.8, y: yOffset, x: 0, rotateZ: rotate },
                animate: { y: yOffset, x: 0, scale, rotateZ: rotate },
                hovered: { y: hoverYOffset, x: hoverXOffset, scale: isFront ? 1.02 : scale + 0.02, rotateZ: hoverRotate }
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`absolute top-0 left-0 w-full h-full rounded-2xl shadow-2xl overflow-hidden ${isFront ? 'z-50' : 'pointer-events-none'}`}
              style={{ zIndex, transformOrigin: 'bottom center' }}
            >
              <div className="w-full h-full pointer-events-none bg-card">
                <CardContent data={article} />
              </div>
              {!isFront && (
                <motion.div
                  className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
                  variants={{ initial: { opacity: 1 }, animate: { opacity: 1 }, hovered: { opacity: 0.1 } }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <div className="text-center z-10 px-6 max-w-md mx-auto mt-6 pointer-events-none flex flex-col items-center gap-6">
        <p className="text-dek font-sans text-sm leading-relaxed line-clamp-2">
          {stack.articles.length} artiklar · {[...new Set(stack.articles.map(a => a.tag || a.category).filter(Boolean))].slice(0, 3).join(', ')}
        </p>
        <button
          className="bg-card px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase text-ink border border-line shadow-sm font-sans mx-auto transition-all pointer-events-auto hover:bg-surface"
          onClick={() => onOpen(stack)}
        >
          Öppna dagsnummer →
        </button>
      </div>
    </div>
  );
};

// ─── Loading skeleton — mirrors the masthead + editorial list ────────────────
const FeedSkeleton = () => (
  <div className="min-h-screen bg-bg">
    <div className="max-w-[640px] mx-auto px-4 pt-16 pb-9 animate-pulse">
      <div className="h-4 w-16 bg-surface rounded mb-5" />
      <div className="h-3 w-52 bg-surface rounded mb-6" />
      <div className="space-y-3 mb-7">
        <div className="h-9 w-full bg-surface rounded" />
        <div className="h-9 w-4/5 bg-surface rounded" />
      </div>
      <div className="flex gap-5">
        <div className="h-3 w-14 bg-surface rounded" />
        <div className="h-3 w-12 bg-surface rounded" />
      </div>
    </div>
    <div className="max-w-[640px] mx-auto px-4 flex flex-col gap-4 pt-6 pb-32">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse bg-card border border-line rounded-2xl p-5" style={{ animationDelay: `${i * 140}ms` }}>
          <div className="h-3 w-20 bg-surface rounded mb-4" />
          <div className="h-6 w-full bg-surface rounded mb-2" />
          <div className="h-6 w-3/4 bg-surface rounded mb-4" />
          <div className="h-3 w-full bg-surface rounded mb-1.5" />
          <div className="h-3 w-5/6 bg-surface rounded" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Main FeedView ────────────────────────────────────────────────────────────
const FeedView = ({ articles, currentDate, setActiveArticle, onLoadPreviousDay, loading }) => {
  const [openStack, setOpenStack] = useState(null);
  const [weekStacks, setWeekStacks] = useState([]);

  const scrollRef = React.useRef(0);
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (articles && articles.length > 0) {
      setWeekStacks(generateWeekStacks(currentDate, articles));
    } else {
      setWeekStacks([]);
    }
    setOpenStack(null);
  }, [currentDate, articles]);

  useEffect(() => {
    if (!openStack && containerRef.current) {
      setTimeout(() => {
        if (containerRef.current) containerRef.current.scrollTop = scrollRef.current;
      }, 50);
    }
  }, [openStack]);

  const handleScroll = (e) => { if (!openStack) scrollRef.current = e.target.scrollTop; };

  if (loading) {
    return <FeedSkeleton />;
  }

  // No articles at all — show a real empty state instead of an eternal spinner.
  if (weekStacks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 text-center">
        <span className="font-serif text-base font-semibold tracking-tight mb-8">Debrief</span>
        <h1 className="font-serif text-3xl text-ink mb-3">Inget publicerat än</h1>
        <p className="text-muted font-sans max-w-sm leading-relaxed">
          Dagens briefer dyker upp här så fort de är handplockade.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">

        {!openStack ? (
          /* ── Timeline view ──────────────────────────────────────────────── */
          <motion.div
            key="stack-timeline-view"
            ref={containerRef}
            onScroll={handleScroll}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-20 bg-bg overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar"
          >
            <div className="pb-32">

              {/* Today — editorial list ─────────────────────────────────── */}
              {weekStacks.length > 0 && (
                <div className="border-b border-line pb-12">
                  <Masthead date={weekStacks[0].date} articles={weekStacks[0].articles} />
                  {weekStacks[0].articles.length === 0 ? (
                    <div className="px-5 py-16 text-center text-muted">
                      Inga artiklar publicerade idag.
                    </div>
                  ) : (
                    <EditorialList articles={weekStacks[0].articles} onArticleClick={setActiveArticle} />
                  )}
                </div>
              )}

              {/* Past days — clickable card stacks ─────────────────────── */}
              {weekStacks.slice(1).map((stack) => (
                <DailyStackNode key={stack.id} stack={stack} onOpen={setOpenStack} />
              ))}

              {/* Load more ────────────────────────────────────────────── */}
              <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 mt-12">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
                  <Layers className="text-muted" size={32} />
                </div>
                <h2 className="font-serif text-3xl text-ink mb-2">Slutet av veckan</h2>
                <p className="text-muted font-sans text-center max-w-sm mb-8">
                  Du har nått slutet av de senaste 7 dagarnas händelser.
                </p>
                <button
                  className="bg-card px-6 py-3 rounded-full text-sm font-bold text-ink border border-line font-sans hover:bg-surface transition-colors"
                  onClick={onLoadPreviousDay}
                >
                  Ladda föregående vecka
                </button>
              </div>
            </div>
          </motion.div>

        ) : (
          /* ── Opened day — full editorial spread ────────────────────────── */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 80, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-30 overflow-y-auto"
          >
            <DayMagazineLayout
              articles={openStack.articles}
              onArticleClick={setActiveArticle}
              date={openStack.date}
              onClose={() => setOpenStack(null)}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default FeedView;
