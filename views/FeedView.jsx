"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardContent } from "@/components/FeedMasonryComponents";
import { Masthead, EditorialList, DayMagazineLayout } from "@/components/DayMagazine";
import { Layers } from 'lucide-react';

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
