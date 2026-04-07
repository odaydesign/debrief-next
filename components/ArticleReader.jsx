"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Bookmark, Share2, Clock, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const ArticleReader = ({ article, onClose, onBookmark }) => {
    const containerRef = useRef(null);
    const { scrollY, scrollYProgress } = useScroll({ container: containerRef });
    const [isAtBottom, setIsAtBottom] = useState(false);
    const touchStartY = useRef(0);

    // Visual feedback for the pull (Mobile only)
    const pullY = useSpring(0, { stiffness: 400, damping: 30 });
    const imageY = useTransform(scrollY, [0, 500], [0, 250]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const atBottom = scrollHeight - scrollTop <= clientHeight + 5;
        setIsAtBottom(atBottom);
    };

    // Notes state
    const [noteText, setNoteText] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Fetch live Convex notes
    const rawNotes = useQuery(api.notes.getByArticle, { articleId: article.id });
    const savedNotes = rawNotes || [];

    const addNoteMutation = useMutation(api.notes.add);

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        setIsSavingNote(true);
        try {
            await addNoteMutation({ articleId: article.id, text: noteText });
            setNoteText('');
        } catch (err) {
            console.error("Failed to add note", err);
        }
        setIsSavingNote(false);
    };

    // --- Touch Logic (Mobile Only) ---
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        if (!isAtBottom) return;

        const currentY = e.touches[0].clientY;
        const delta = currentY - touchStartY.current;

        if (delta < 0) { // Pulling up
            pullY.set(delta * 0.4);
        }
    };

    const handleTouchEnd = (e) => {
        if (pullY.get() < -100) {
            if (navigator?.vibrate) navigator.vibrate(10);
            onClose();
        } else {
            pullY.set(0);
        }
    };
    // --------------------------------

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.summary,
                    url: window.location.href,
                });
            } catch (err) { }
        } else {
            navigator.clipboard.writeText(window.location.href);
            // Could add toast here
        }
    };

    return (
        <motion.div
            layoutId={`article-card-${article.id}`}
            className="fixed inset-0 z-50 bg-white flex flex-col md:max-w-lg md:mx-auto md:shadow-2xl md:border-x md:border-gray-100"
            initial={{ borderRadius: "1.5rem" }}
            animate={{ borderRadius: "0px" }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
        >
            {/* Header */}
            <motion.div
                className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {/* Progress Bar */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-1 bg-blue-500 origin-left z-30"
                    style={{ scaleX: scrollYProgress }}
                />

                <button
                    onClick={onClose}
                    className="pointer-events-auto w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 border border-black/5 shadow-sm active:scale-95 transition-transform"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={onBookmark} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 border border-black/5 shadow-sm">
                        <Bookmark size={20} className={article.isBookmarked ? 'fill-blue-500 text-blue-500' : ''} />
                    </button>
                    <button onClick={handleShare} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-900 border border-black/5 shadow-sm">
                        <Share2 size={20} />
                    </button>
                </div>
            </motion.div>

            {/* Content scroller */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="flex-1 overflow-y-scroll no-scrollbar relative z-10 bg-white"
            >
                <motion.div style={{ y: pullY }}>
                    {/* Hero Image */}
                    <motion.div
                        layoutId={`article-image-container-${article.id}`}
                        className="relative h-[45vh] w-full overflow-hidden"
                    >
                        <motion.img
                            layoutId={`article-image-${article.id}`}
                            style={{ y: imageY }}
                            src={article.image}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90" />

                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block">{article.category}</span>
                            <motion.h1
                                layoutId={`article-title-${article.id}`}
                                className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tight"
                            >
                                {article.title}
                            </motion.h1>
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Clock size={12} /> {article.readTime || '4 min'}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                <span>{article.author || 'Debrief'}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Body */}
                    <div className="px-6 py-8 pb-32 max-w-2xl mx-auto">
                        <motion.p
                            layoutId={`article-summary-${article.id}`}
                            className="text-xl font-medium text-gray-800 mb-8 leading-relaxed font-serif"
                        >
                            {article.summary}
                        </motion.p>

                        <div
                            className="prose prose-lg text-gray-600 font-serif leading-loose mb-12"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {/* Quick Notes Section */}
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-12">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans">Quick Notes</h3>
                            <p className="text-sm text-gray-500 mb-4 font-sans">Jot down your thoughts while reading.</p>

                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="What's interesting about this?"
                                className="w-full bg-white border border-stone-200 rounded-xl p-4 min-h-[100px] mb-4 text-gray-800 font-sans focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition-shadow"
                            />

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveNote}
                                    disabled={isSavingNote || !noteText.trim()}
                                    className="bg-gray-900 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all font-sans"
                                >
                                    {isSavingNote ? 'Saving...' : 'Save Note'}
                                </button>
                            </div>

                            {/* Existing Notes for this article */}
                            {savedNotes.length > 0 && (
                                <div className="mt-8 space-y-4">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-sans border-b border-stone-200 pb-2">Previous Notes</h4>
                                    {savedNotes.map(n => (
                                        <div key={n._id} className="bg-white border border-stone-100 p-4 rounded-xl">
                                            <p className="text-gray-700 font-sans text-sm">{n.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="py-20 flex flex-col items-center justify-center opacity-40 space-y-2">
                            <div className="animate-bounce">
                                <ArrowRight className="rotate-90 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-400">Fortsätt scrolla för att stänga</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ArticleReader;
