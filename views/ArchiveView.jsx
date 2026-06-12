"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { DayMagazineLayout, EditorialList, editionNo, totalMinutes, summaryParts } from "@/components/DayMagazine";

// ─── Date helpers ─────────────────────────────────────────────────────────────
const isoWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return { week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7), year: d.getUTCFullYear() };
};

const mondayOf = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
};

// "9–15 juni" within one month, "29 maj – 4 juni" across months
const weekRangeLabel = (monday) => {
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    if (monday.getMonth() === sunday.getMonth()) {
        return `${monday.getDate()}–${sunday.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}`;
    }
    return `${monday.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}`;
};

const MODES = [
    { id: 'dag', label: 'Dag' },
    { id: 'vecka', label: 'Vecka' },
    { id: 'månad', label: 'Månad' },
];

// ─── One group row (day / week / month) in the index ─────────────────────────
const GroupRow = ({ title, sub, articles, onOpen }) => {
    const titles = articles.map(a => a.title).filter(Boolean);
    const thumb = articles.find(a => a.image)?.image;
    const tags = [...new Set(articles.map(a => a.tag || a.category).filter(Boolean))].slice(0, 3);

    return (
        <button
            onClick={onOpen}
            className="w-full text-left group flex items-start gap-4 py-5 px-3 -mx-3 rounded-2xl hover:bg-card transition-colors border-b border-line last:border-b-0"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1.5">
                    <h3 className="font-serif text-[1.25rem] md:text-[1.4rem] leading-tight tracking-tight capitalize">
                        {title}
                    </h3>
                    {sub && <span className="meta shrink-0">{sub}</span>}
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

// ─── Opened week / month — editorial spread with a woven-headline masthead ───
const GroupSpread = ({ group, onArticleClick, onClose }) => {
    const { ink, tail } = summaryParts(group.articles);
    const dayCount = new Set(group.articles.map(a => {
        const d = a.date instanceof Date ? a.date : new Date(a.date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })).size;

    return (
        <div className="min-h-screen bg-bg text-ink">
            <div className="max-w-[640px] mx-auto px-4 pt-16 pb-9">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors mb-5 group"
                >
                    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                    Tillbaka
                </button>

                <p className="kicker mb-3">{group.kicker}</p>

                <h1 className="font-serif font-semibold text-[1.95rem] md:text-[2.6rem] leading-[1.08] tracking-tight">
                    {ink}{tail ? <> och <span className="text-muted">{tail}.</span></> : '.'}
                </h1>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-5">
                    <span className="meta">{group.articles.length} {group.articles.length === 1 ? 'brief' : 'briefer'}</span>
                    <span className="meta">{totalMinutes(group.articles)} min</span>
                    <span className="meta">{dayCount} {dayCount === 1 ? 'dag' : 'dagar'}</span>
                </div>
            </div>

            <main className="pt-6 pb-24">
                <EditorialList articles={group.articles} onArticleClick={onArticleClick} />
            </main>
        </div>
    );
};

// ─── Main ArchiveView ─────────────────────────────────────────────────────────
const ArchiveView = ({ articles, setActiveArticle }) => {
    const [mode, setMode] = useState('dag');
    const [openGroup, setOpenGroup] = useState(null);

    // Track scroll position of the archive index
    const scrollRef = React.useRef(0);
    const containerRef = React.useRef(null);

    // sections = [{ label, groups: [{ key, title, sub, kicker, articles, isDay, date }] }]
    const sections = useMemo(() => {
        // Bucket by calendar day first (newest first) — every mode builds on days.
        const byDay = new Map();
        articles.forEach(art => {
            const d = art.date instanceof Date ? art.date : new Date(art.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!byDay.has(key)) byDay.set(key, { key, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), articles: [] });
            byDay.get(key).articles.push(art);
        });
        const days = [...byDay.values()].sort((a, b) => b.date - a.date);

        const out = [];
        const pushUnder = (label, group) => {
            const last = out[out.length - 1];
            if (!last || last.label !== label) out.push({ label, groups: [group] });
            else last.groups.push(group);
        };

        if (mode === 'dag') {
            for (const day of days) {
                pushUnder(day.date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }), {
                    key: day.key,
                    title: day.date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }),
                    sub: `№${editionNo(day.date)}`,
                    articles: day.articles,
                    isDay: true,
                    date: day.date,
                });
            }
        } else if (mode === 'vecka') {
            const byWeek = new Map();
            for (const day of days) {
                const { week, year } = isoWeek(day.date);
                const key = `${year}-v${week}`;
                if (!byWeek.has(key)) {
                    const monday = mondayOf(day.date);
                    byWeek.set(key, {
                        key,
                        title: `Vecka ${week}`,
                        sub: weekRangeLabel(monday),
                        kicker: `Vecka ${week} · ${weekRangeLabel(monday)} ${year}`,
                        year,
                        articles: [],
                    });
                }
                byWeek.get(key).articles.push(...day.articles);
            }
            for (const wk of byWeek.values()) pushUnder(String(wk.year), wk);
        } else {
            const byMonth = new Map();
            for (const day of days) {
                const key = `${day.date.getFullYear()}-${day.date.getMonth()}`;
                if (!byMonth.has(key)) {
                    const monthName = day.date.toLocaleDateString('sv-SE', { month: 'long' });
                    byMonth.set(key, {
                        key,
                        title: monthName,
                        sub: null,
                        kicker: `Månad · ${monthName} ${day.date.getFullYear()}`,
                        year: day.date.getFullYear(),
                        days: 0,
                        articles: [],
                    });
                }
                const m = byMonth.get(key);
                m.days += 1;
                m.articles.push(...day.articles);
            }
            for (const m of byMonth.values()) {
                m.sub = `${m.days} ${m.days === 1 ? 'dag' : 'dagar'}`;
                pushUnder(String(m.year), m);
            }
        }
        return out;
    }, [articles, mode]);

    const groupCount = sections.reduce((acc, s) => acc + s.groups.length, 0);
    const groupNoun = mode === 'dag' ? 'nummer' : mode === 'vecka' ? (groupCount === 1 ? 'vecka' : 'veckor') : (groupCount === 1 ? 'månad' : 'månader');

    // Restore scroll position when returning to the index
    useEffect(() => {
        if (!openGroup && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) containerRef.current.scrollTop = scrollRef.current;
            }, 50);
        }
    }, [openGroup]);

    const handleScroll = (e) => { if (!openGroup) scrollRef.current = e.target.scrollTop; };

    const switchMode = (m) => {
        setMode(m);
        scrollRef.current = 0;
        if (containerRef.current) containerRef.current.scrollTop = 0;
    };

    return (
        <div className="w-full relative min-h-screen overflow-hidden bg-bg">
            <AnimatePresence mode="wait">
                {!openGroup ? (
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
                            <header className="pt-16 pb-2">
                                <span className="font-serif text-base font-semibold tracking-tight block mb-3">Debrief</span>
                                <p className="kicker mb-3">Arkiv</p>
                                <h1 className="font-serif font-semibold text-[1.95rem] md:text-[2.6rem] leading-[1.08] tracking-tight">
                                    Tidigare nummer
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-5">
                                    <span className="meta">{groupCount} {groupNoun}</span>
                                    <span className="meta">{articles.length} briefer</span>
                                </div>
                            </header>

                            {/* Grouping switch — sticky so it stays reachable while scrolling */}
                            <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-bg/90 backdrop-blur-md">
                                <div className="flex gap-1 bg-card border border-line rounded-full p-1 max-w-[320px]" role="tablist" aria-label="Gruppera arkivet">
                                    {MODES.map(({ id, label }) => (
                                        <button
                                            key={id}
                                            role="tab"
                                            aria-selected={mode === id}
                                            onClick={() => switchMode(id)}
                                            className={`flex-1 py-2 text-[11px] tracking-widest font-bold rounded-full uppercase transition-all duration-300 ${mode === id
                                                ? 'bg-ink text-bg shadow-md'
                                                : 'text-muted hover:text-ink'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sections with group rows */}
                            {sections.map((section) => (
                                <section key={section.label}>
                                    <h2 className="kicker capitalize pt-8 pb-3 border-b border-line">{section.label}</h2>
                                    {section.groups.map((group) => (
                                        <GroupRow
                                            key={group.key}
                                            title={group.title}
                                            sub={group.sub}
                                            articles={group.articles}
                                            onOpen={() => setOpenGroup(group)}
                                        />
                                    ))}
                                </section>
                            ))}

                            {sections.length === 0 && (
                                <div className="text-center text-muted mt-24 font-sans text-sm">
                                    Arkivet är tomt än så länge.
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="archive-open-group"
                        initial={{ opacity: 0, y: 80, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.98 }}
                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 z-30 bg-bg overflow-y-auto"
                    >
                        {openGroup.isDay ? (
                            <DayMagazineLayout
                                articles={openGroup.articles}
                                onArticleClick={setActiveArticle}
                                date={openGroup.date}
                                onClose={() => setOpenGroup(null)}
                            />
                        ) : (
                            <GroupSpread
                                group={openGroup}
                                onArticleClick={setActiveArticle}
                                onClose={() => setOpenGroup(null)}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArchiveView;
