"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { DayMagazineLayout, editionNo, totalMinutes } from "@/components/DayMagazine";

// ─── One edition (day) row in the index ──────────────────────────────────────
const EditionRow = ({ date, articles, onOpen }) => {
    const titles = articles.map(a => a.title).filter(Boolean);
    const thumb = articles.find(a => a.image)?.image;
    const dateLabel = date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    const tags = [...new Set(articles.map(a => a.tag || a.category).filter(Boolean))].slice(0, 3);

    return (
        <button
            onClick={onOpen}
            className="w-full text-left group flex items-start gap-4 py-5 px-3 -mx-3 rounded-2xl hover:bg-card transition-colors border-b border-line last:border-b-0"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1.5">
                    <h3 className="font-serif text-[1.25rem] md:text-[1.4rem] leading-tight tracking-tight capitalize">
                        {dateLabel}
                    </h3>
                    <span className="meta shrink-0">№{editionNo(date)}</span>
                </div>
                {titles.length > 0 && (
                    <p className="text-dek text-[14px] leading-relaxed line-clamp-2">
                        {titles.slice(0, 3).join(' · ')}
                    </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
                    <span className="meta">{articles.length} {articles.length === 1 ? 'brief' : 'briefer'}</span>
                    <span className="meta">{totalMinutes(articles)} min</span>
                    {tags.length > 0 && <span className="meta truncate">{tags.join(', ')}</span>}
                </div>
            </div>

            {thumb && (
                <div className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border border-line mt-1">
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                </div>
            )}

            <ArrowRight
                size={16}
                className="shrink-0 mt-2 text-faint group-hover:text-accent group-hover:translate-x-0.5 transition-all"
            />
        </button>
    );
};

// ─── Main ArchiveView ─────────────────────────────────────────────────────────
const ArchiveView = ({ articles, setActiveArticle }) => {
    const [openDay, setOpenDay] = useState(null);

    // Track scroll position of the archive index
    const scrollRef = React.useRef(0);
    const containerRef = React.useRef(null);

    // Group by day (newest first), then bucket days under month headers.
    const months = useMemo(() => {
        const byDay = new Map();
        articles.forEach(art => {
            const d = art.date instanceof Date ? art.date : new Date(art.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!byDay.has(key)) byDay.set(key, { key, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), articles: [] });
            byDay.get(key).articles.push(art);
        });
        const days = [...byDay.values()].sort((a, b) => b.date - a.date);

        const out = [];
        for (const day of days) {
            const label = day.date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
            const last = out[out.length - 1];
            if (!last || last.label !== label) out.push({ label, days: [day] });
            else last.days.push(day);
        }
        return out;
    }, [articles]);

    const dayCount = months.reduce((acc, m) => acc + m.days.length, 0);

    // Restore scroll position when returning to the index
    useEffect(() => {
        if (!openDay && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) containerRef.current.scrollTop = scrollRef.current;
            }, 50);
        }
    }, [openDay]);

    const handleScroll = (e) => { if (!openDay) scrollRef.current = e.target.scrollTop; };

    return (
        <div className="w-full relative min-h-screen overflow-hidden bg-bg">
            <AnimatePresence mode="wait">
                {!openDay ? (
                    <motion.div
                        key="archive-index"
                        ref={containerRef}
                        onScroll={handleScroll}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 z-20 overflow-y-auto custom-scrollbar"
                    >
                        <div className="max-w-[640px] mx-auto px-4 pb-32">
                            {/* Masthead-style header */}
                            <header className="pt-16 pb-4">
                                <span className="font-serif text-base font-semibold tracking-tight block mb-3">Debrief</span>
                                <p className="kicker mb-3">Arkiv</p>
                                <h1 className="font-serif font-semibold text-[1.95rem] md:text-[2.6rem] leading-[1.08] tracking-tight">
                                    Tidigare nummer
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-5">
                                    <span className="meta">{dayCount} nummer</span>
                                    <span className="meta">{articles.length} briefer</span>
                                </div>
                            </header>

                            {/* Month sections with edition rows */}
                            {months.map((month) => (
                                <section key={month.label}>
                                    <h2 className="kicker capitalize pt-10 pb-3 border-b border-line">{month.label}</h2>
                                    {month.days.map((day) => (
                                        <EditionRow
                                            key={day.key}
                                            date={day.date}
                                            articles={day.articles}
                                            onOpen={() => setOpenDay(day)}
                                        />
                                    ))}
                                </section>
                            ))}

                            {months.length === 0 && (
                                <div className="text-center text-muted mt-24 font-sans text-sm">
                                    Arkivet är tomt än så länge.
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="archive-open-day"
                        initial={{ opacity: 0, y: 80, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.98 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 z-30 bg-bg overflow-y-auto"
                    >
                        <DayMagazineLayout
                            articles={openDay.articles}
                            onArticleClick={setActiveArticle}
                            date={openDay.date}
                            onClose={() => setOpenDay(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArchiveView;
