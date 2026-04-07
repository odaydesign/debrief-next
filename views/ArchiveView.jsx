"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeInCard, CardContent } from "@/components/FeedMasonryComponents";

// Archive Stack component in a 2-column grid format
const ArchiveStackNode = ({ label, articles, onOpen }) => {
    const stackCards = articles.slice(0, 3).reverse();

    return (
        <motion.div
            className="flex flex-col items-center justify-start p-4 bg-white/5 rounded-3xl border border-white/10 cursor-pointer group hover:bg-white/10 transition-colors"
            onClick={() => onOpen({ label, articles })}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
        >
            <motion.div
                className="w-full relative aspect-[3/4] perspective-1000 mt-4 mb-6"
                whileHover="hovered"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    hovered: { opacity: 1, y: 0 }
                }}
            >
                {stackCards.map((article, idx) => {
                    const stackDepth = stackCards.length - idx - 1;
                    const scale = 1 - (stackDepth * 0.08);
                    // Tighter vertical stacking for the grid view
                    const yOffset = stackDepth * 15;
                    const rotate = stackDepth % 2 === 0 ? stackDepth * 3 : stackDepth * -3;
                    const zIndex = 50 - stackDepth;
                    const isFront = stackDepth === 0;

                    let hoverRotate = 0;
                    let hoverYOffset = yOffset - 15;
                    let hoverXOffset = 0;

                    if (stackDepth === 1) {
                        hoverYOffset = yOffset - 25;
                        hoverRotate = -6;
                        hoverXOffset = -15;
                    } else if (stackDepth === 2) {
                        hoverYOffset = yOffset - 35;
                        hoverRotate = 6;
                        hoverXOffset = 15;
                    }

                    return (
                        <motion.div
                            key={article.id || `archive-stack-${idx}`}
                            variants={{
                                initial: { scale: 0.8, y: yOffset, x: 0, rotateZ: rotate },
                                animate: { y: yOffset, x: 0, scale, rotateZ: rotate },
                                hovered: { y: hoverYOffset, x: hoverXOffset, scale: isFront ? 1.05 : scale + 0.03, rotateZ: hoverRotate }
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`absolute top-0 left-0 w-full h-full rounded-2xl shadow-xl overflow-hidden ${isFront ? 'z-50' : 'pointer-events-none'}`}
                            style={{ zIndex, transformOrigin: "bottom center" }}
                        >
                            <div className="w-full h-full pointer-events-none text-[8px] bg-[#f6f4f1]">
                                <CardContent data={article} />
                            </div>
                            {!isFront && (
                                <motion.div
                                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                                    variants={{
                                        initial: { opacity: 1 },
                                        animate: { opacity: 1 },
                                        hovered: { opacity: 0.1 }
                                    }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                            {/* Optional glass overlay to make it look intentionally archived */}
                            <div className="absolute inset-0 bg-[#46423f]/10 pointer-events-none mix-blend-overlay"></div>
                        </motion.div>
                    );
                })}
            </motion.div>
            <div className="text-center w-full px-2">
                <h3 className="text-[#f6f4f1] font-serif text-xl mb-1 tracking-tight capitalize truncate px-2">{label}</h3>
                <p className="text-[#f6f4f1]/60 font-sans text-xs mb-3">
                    {articles.length} Artiklar
                </p>
                <button className="w-full bg-[#f6f4f1]/10 backdrop-blur-md py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase text-[#f6f4f1] border border-[#f6f4f1]/20 font-sans group-hover:bg-[#f6f4f1]/20 transition-colors">
                    Visa samling
                </button>
            </div>
        </motion.div>
    );
};


const ArchiveView = ({ articles, setActiveArticle }) => {
    const [mode, setMode] = useState('vecka'); // 'dag', 'vecka', 'månad'
    const [openGroup, setOpenGroup] = useState(null);

    // Track scroll position of the main archive grid
    const scrollRef = React.useRef(0);
    const containerRef = React.useRef(null);

    const groupsObj = useMemo(() => {
        const g = {};
        articles.forEach(art => {
            const date = art.date instanceof Date ? art.date : new Date(art.date);
            let key;
            if (mode === 'dag') {
                key = date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
            } else if (mode === 'månad') {
                key = `${date.toLocaleString('sv-SE', { month: 'long' })} ${date.getFullYear()}`;
            } else {
                key = `Vecka ${Math.ceil(date.getDate() / 7)}, ${date.toLocaleString('sv-SE', { month: 'short' })}`;
            }

            if (!g[key]) g[key] = [];
            g[key].push(art);
        });
        return g;
    }, [articles, mode]);

    // Convert to array of [label, articles] to map easily
    const groups = Object.entries(groupsObj);

    // Restore scroll position when returning to the archive group view
    useEffect(() => {
        if (!openGroup && containerRef.current) {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = scrollRef.current;
                }
            }, 50);
        }
    }, [openGroup]);

    const handleScroll = (e) => {
        if (!openGroup) {
            scrollRef.current = e.target.scrollTop;
        }
    };

    return (
        <div className="w-full relative min-h-screen overflow-hidden bg-[#46423f]">
            <AnimatePresence mode="wait">
                {!openGroup ? (
                    <motion.div
                        key="archive-grid"
                        ref={containerRef}
                        onScroll={handleScroll}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-20 overflow-y-auto pb-32 pt-12 px-4 md:px-8 custom-scrollbar"
                    >
                        <header className="mb-10 text-center">
                            <h1 className="text-4xl font-serif text-[#f6f4f1] tracking-tight mb-2 drop-shadow-sm">Arkivbibliotek</h1>
                            <p className="text-[#f6f4f1]/60 font-sans text-sm mb-8">Utforska tidigare samlingar av insikter.</p>

                            <div className="flex bg-black/20 p-1.5 rounded-full backdrop-blur-md w-full max-w-sm mx-auto border border-white/5">
                                {['dag', 'vecka', 'månad'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`flex-1 py-2 text-[11px] tracking-widest font-bold rounded-full uppercase transition-all duration-300 ${mode === m
                                            ? 'bg-[#f6f4f1] text-[#46423f] shadow-md'
                                            : 'text-white/50 hover:text-[#f6f4f1]'
                                            }`}
                                    >
                                        {m === 'dag' ? 'Dag' : m === 'vecka' ? 'Vecka' : 'Månad'}
                                    </button>
                                ))}
                            </div>
                        </header>

                        {/* Grid of Archive Stacks */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-[1200px] mx-auto">
                            {groups.map(([label, groupArticles]) => (
                                <ArchiveStackNode
                                    key={label}
                                    label={label}
                                    articles={groupArticles}
                                    onOpen={setOpenGroup}
                                />
                            ))}
                        </div>

                        {groups.length === 0 && (
                            <div className="text-center text-white/40 mt-20 font-sans text-sm">
                                Inga artiklar hittades för denna gruppering.
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="archive-expanded-grid"
                        initial={{ opacity: 0, y: 150, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 z-30 bg-[#46423f] overflow-y-auto"
                    >
                        {/* Sticky Header for the grid view */}
                        <div className="sticky top-0 left-0 right-0 p-6 md:p-8 z-30 bg-gradient-to-b from-[#46423f]/90 to-transparent backdrop-blur-[2px] pointer-events-none flex justify-between items-start pt-6 md:pt-10">
                            <div>
                                <h2 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1 font-sans drop-shadow-md">
                                    Arkivsamling
                                </h2>
                                <h1 className="text-3xl md:text-4xl font-serif text-[#f6f4f1] drop-shadow-md tracking-tight capitalize">
                                    {openGroup.label}
                                </h1>
                            </div>
                            <button
                                className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-bold text-[#f6f4f1] border border-white/20 shadow-sm font-sans pointer-events-auto cursor-pointer hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg shadow-black/20"
                                onClick={() => setOpenGroup(null)}
                            >
                                Tillbaka till arkivet
                            </button>
                        </div>

                        <main className="w-full flex justify-center pb-32 pt-8 px-4">
                            <div className="w-full max-w-[340px] md:max-w-[704px] xl:max-w-[1068px] 2xl:max-w-[1432px]">
                                <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-6 space-y-6">
                                    {openGroup.articles.map((card, index) => (
                                        <FadeInCard key={`archive-${card.id || index}`} index={index} onClick={() => setActiveArticle(card)}>
                                            <CardContent data={card} />
                                        </FadeInCard>
                                    ))}
                                </div>
                            </div>
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ArchiveView;
