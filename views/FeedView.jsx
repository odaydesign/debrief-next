"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInCard, CardContent } from "@/components/FeedMasonryComponents";
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

// ─── Reusable card grid — masonry of rich cards (matches Search / Archive) ───
const DayGrid = ({ articles, onArticleClick }) => (
  <div className="w-full flex justify-center px-4 pb-16">
    <div className="w-full max-w-[340px] md:max-w-[704px] xl:max-w-[1068px]">
      <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
        {articles.map((a, i) => (
          <FadeInCard key={a._id || a.id || i} index={i} onClick={() => onArticleClick(a)}>
            <div className="pointer-events-none h-full w-full">
              <CardContent data={a} />
            </div>
          </FadeInCard>
        ))}
      </div>
    </div>
  </div>
);

// ─── Day layout — header + card grid, used for opened stacks ───
const DayMagazineLayout = ({ articles, onArticleClick, date, onClose }) => {
  const tags = [...new Set(articles.map(a => a.tag || a.category).filter(Boolean))];

  const dateLabel = date.toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#46423f] text-[#f6f4f1]">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="px-5 md:px-10 pt-8 pb-6">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-white/50 hover:text-[#f6f4f1] transition-colors mb-6 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Tillbaka
          </button>
        )}

        <div className="max-w-[1068px] mx-auto">
          <div className="flex items-end justify-between gap-4 mb-3">
            <h1 className="font-serif text-[2.5rem] md:text-[3.75rem] leading-none tracking-tight capitalize text-[#f6f4f1]">
              {dateLabel}
            </h1>
            <span className="text-[12px] text-white/40 shrink-0 hidden md:block pb-1">
              {articles.length} artiklar
            </span>
          </div>

          {/* Tag chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#50c878]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="h-px bg-white/15 mt-4" />
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="px-5 py-20 text-center text-white/40">
          Inga artiklar publicerade denna dag.
        </div>
      ) : (
        <main className="pt-4">
          <DayGrid articles={articles} onArticleClick={onArticleClick} />
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
        <div className="text-center drop-shadow-md">
          <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 font-sans">
            Dagens Samling
          </h2>
          <h1 className="text-4xl font-serif text-[#f6f4f1] capitalize leading-none">
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
              className={`absolute top-0 left-0 w-full h-full rounded-[2.5rem] shadow-2xl overflow-hidden ${isFront ? 'z-50' : 'pointer-events-none'}`}
              style={{ zIndex, transformOrigin: 'bottom center' }}
            >
              <div className="w-full h-full pointer-events-none bg-[#f6f4f1]">
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
        <p className="text-[#f6f4f1]/70 font-sans text-sm leading-relaxed line-clamp-2">
          {stack.articles.length} artiklar · {[...new Set(stack.articles.map(a => a.tag || a.category).filter(Boolean))].slice(0, 3).join(', ')}
        </p>
        <button
          className="bg-[#f6f4f1]/10 backdrop-blur-md px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase text-[#f6f4f1] border border-[#f6f4f1]/20 shadow-sm font-sans mx-auto transition-all pointer-events-auto hover:bg-[#f6f4f1]/20"
          onClick={() => onOpen(stack)}
        >
          Öppna dagsnummer →
        </button>
      </div>
    </div>
  );
};

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

  if (loading || weekStacks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#46423f]">
        <div className="animate-pulse space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#605c59] rounded-full" />
          <p className="text-white/50 font-sans tracking-widest text-xs uppercase">Laddar sammanfattning</p>
        </div>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-20 bg-[#46423f] overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar"
          >
            <div className="pb-32">

              {/* Today — card grid inline ───────────────────────────────── */}
              {weekStacks.length > 0 && (
                <div className="border-b border-white/10 pb-12">
                  {/* Dark masthead */}
                  <div className="bg-gradient-to-b from-black/30 to-transparent px-5 md:px-10 pt-14 pb-10 text-center">
                    <p className="text-[11px] font-bold text-[#50c878] uppercase tracking-[0.25em] mb-3 font-sans">
                      Dagens Översikt
                    </p>
                    <h1 className="text-[2.75rem] md:text-[4rem] font-serif text-[#f6f4f1] capitalize leading-none tracking-tight">
                      {weekStacks[0].date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h1>
                  </div>

                  {weekStacks[0].articles.length === 0 ? (
                    <div className="px-5 py-16 text-center text-white/40">
                      Inga artiklar publicerade idag.
                    </div>
                  ) : (
                    <DayGrid articles={weekStacks[0].articles} onArticleClick={setActiveArticle} />
                  )}
                </div>
              )}

              {/* Past days — clickable card stacks ─────────────────────── */}
              {weekStacks.slice(1).map((stack) => (
                <DailyStackNode key={stack.id} stack={stack} onOpen={setOpenStack} />
              ))}

              {/* Load more ────────────────────────────────────────────── */}
              <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 mt-12">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Layers className="text-white/40" size={32} />
                </div>
                <h2 className="font-serif text-3xl text-[#f6f4f1] mb-2">Slutet av veckan</h2>
                <p className="text-white/50 font-sans text-center max-w-sm mb-8">
                  Du har nått slutet av de senaste 7 dagarnas händelser.
                </p>
                <button
                  className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold text-[#f6f4f1] border border-white/20 font-sans hover:bg-white/20 transition-colors"
                  onClick={onLoadPreviousDay}
                >
                  Ladda föregående vecka
                </button>
              </div>
            </div>
          </motion.div>

        ) : (
          /* ── Opened day — full magazine spread ─────────────────────────── */
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
