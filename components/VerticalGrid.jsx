"use client";

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import GridCard from './GridCard';

const VerticalGrid = ({ articles, currentDate, onBookmark, onOpenArticle, onClose }) => {
    const scrollRef = useRef(null);

    // Provide a summary message for the day based on the first few articles (mocked)
    const summaryMsg = "Apple Vision Pro updates and new design trends highlight today's briefing.";

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className="fixed inset-0 z-40 bg-stone-100 overflow-y-auto no-scrollbar pb-32"
            ref={scrollRef}
        >
            <div className="sticky top-0 z-10 bg-stone-100/90 backdrop-blur-xl border-b border-stone-200/50 p-4 px-6 flex items-center justify-between">
                <button onClick={onClose} className="p-2 rounded-full bg-white shadow-sm active:scale-95 transition-transform text-stone-600">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-sm font-bold tracking-widest text-stone-900 uppercase font-sans">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </h1>
                <div className="w-10"></div> {/* spacer */}
            </div>

            <div className="max-w-lg mx-auto px-4 pt-8">
                <div className="mb-8 px-2">
                    <h2 className="text-3xl font-serif text-stone-900 leading-tight mb-2">Today's Briefing</h2>
                    <p className="text-stone-500 font-sans text-sm">{summaryMsg}</p>
                </div>

                <div className="space-y-2">
                    {articles.map((article, idx) => (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <GridCard
                                article={article}
                                onBookmark={onBookmark}
                                onClick={onOpenArticle}
                            />
                        </motion.div>
                    ))}
                </div>

                <div className="py-24 text-center">
                    <p className="text-stone-400 font-sans text-sm mb-4">You've reached the end of today's news.</p>
                    <button
                        onClick={onClose}
                        className="mx-auto flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-full font-bold text-sm tracking-wide active:scale-95 transition-transform"
                    >
                        <ArrowUp size={16} /> Read Yesterday's News
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default VerticalGrid;
