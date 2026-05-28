"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Bookmark, Share2, Clock, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const COLORS = [
  { id: 'yellow', name: 'Gul', hex: '#FEF08A', class: 'highlight-yellow' },
  { id: 'green', name: 'Grön', hex: '#A7F3D0', class: 'highlight-green' },
  { id: 'blue', name: 'Blå', hex: '#BFDBFE', class: 'highlight-blue' },
  { id: 'purple', name: 'Lila', hex: '#E9D5FF', class: 'highlight-purple' },
];

const getHighlightedHTML = (content, notesList) => {
    if (!content || !notesList || notesList.length === 0) return content;
    
    let highlightedHTML = content;
    const highlightNotes = [...notesList]
        .filter(n => n.highlightText && n.highlightText.trim())
        .sort((a, b) => b.highlightText.length - a.highlightText.length);

    highlightNotes.forEach(note => {
        const textToHighlight = note.highlightText;
        const color = note.color || 'yellow';
        const escapedText = textToHighlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        const parts = highlightedHTML.split(/(<[^>]+>)/g);
        const regex = new RegExp(escapedText, 'g');
        
        const updatedParts = parts.map(part => {
            if (part.startsWith('<')) {
                return part;
            }
            return part.replace(regex, `<span class="highlight-node highlight-${color}" data-note-id="${note._id}">$&</span>`);
        });
        
        highlightedHTML = updatedParts.join('');
    });
    
    return highlightedHTML;
};

const ArticleReader = ({ article, onClose, onBookmark }) => {
    const containerRef = useRef(null);
    const { scrollY, scrollYProgress } = useScroll({ container: containerRef });
    const [isAtBottom, setIsAtBottom] = useState(false);
    const touchStartY = useRef(0);

    // Visual feedback for the pull (Mobile only)
    const pullY = useSpring(0, { stiffness: 400, damping: 30 });
    const imageY = useTransform(scrollY, [0, 500], [0, 250]);

    // Highlighting & selection states
    const [selectedText, setSelectedText] = useState('');
    const [selectionCoords, setSelectionCoords] = useState(null);
    const [selectedColor, setSelectedColor] = useState('yellow');
    const [selectionNote, setSelectionNote] = useState('');

    // Tooltip states for active highlights
    const [tooltipNote, setTooltipNote] = useState(null);
    const [tooltipCoords, setTooltipCoords] = useState(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const atBottom = scrollHeight - scrollTop <= clientHeight + 5;
        setIsAtBottom(atBottom);

        if (tooltipNote) {
            setTooltipNote(null);
            setTooltipCoords(null);
        }
    };

    // Notes state
    const [noteText, setNoteText] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);

    // Fetch live Convex notes
    const rawNotes = useQuery(api.notes.getByArticle, { articleId: article.id });
    const savedNotes = rawNotes || [];

    const addNoteMutation = useMutation(api.notes.add);
    const deleteNoteMutation = useMutation(api.notes.remove);

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

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectedText('');
            setSelectionCoords(null);
            return;
        }

        const selectedStr = selection.toString().trim();
        if (!selectedStr) {
            setSelectedText('');
            setSelectionCoords(null);
            return;
        }

        try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setSelectedText(selectedStr);
            setSelectionCoords({
                top: rect.top - 70,
                left: rect.left + rect.width / 2,
            });
        } catch (err) {
            console.error("Error reading selection range", err);
        }
    };

    const clearSelection = () => {
        setSelectedText('');
        setSelectionCoords(null);
        window.getSelection()?.removeAllRanges();
    };

    const handleCreateHighlight = async () => {
        if (!selectedText) return;
        try {
            await addNoteMutation({
                articleId: article.id,
                text: selectionNote.trim() || 'Highlight',
                highlightText: selectedText,
                color: selectedColor,
            });
            clearSelection();
            setSelectionNote('');
        } catch (err) {
            console.error("Failed to save highlight:", err);
        }
    };

    const handleBodyClick = (e) => {
        const highlightSpan = e.target.closest('.highlight-node');
        if (highlightSpan) {
            const noteId = highlightSpan.getAttribute('data-note-id');
            const clickedNote = savedNotes.find(n => n._id === noteId);
            if (clickedNote) {
                const rect = highlightSpan.getBoundingClientRect();
                setTooltipNote(clickedNote);
                setTooltipCoords({
                    top: rect.bottom + 8,
                    left: rect.left + rect.width / 2,
                });
            }
        } else {
            setTooltipNote(null);
            setTooltipCoords(null);
        }
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
                            className="prose prose-lg text-gray-600 font-serif leading-loose mb-12 select-text"
                            onMouseUp={handleTextSelection}
                            onTouchEnd={handleTextSelection}
                            onClick={handleBodyClick}
                            dangerouslySetInnerHTML={{ __html: getHighlightedHTML(article.content, savedNotes) }}
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
                                        <div key={n._id} className="bg-white border border-stone-100 p-4 rounded-xl flex flex-col gap-2">
                                            {n.highlightText && (
                                                <p className={`text-[11px] pl-2 border-l-2 font-serif italic text-gray-600 ${
                                                    n.color === 'green' ? 'border-emerald-400' :
                                                    n.color === 'blue' ? 'border-blue-400' :
                                                    n.color === 'purple' ? 'border-purple-400' : 'border-yellow-400'
                                                }`}>
                                                    "{n.highlightText}"
                                                </p>
                                            )}
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

            {/* CSS Highlights Styles */}
            <style>{`
                .highlight-node {
                    border-radius: 0.25rem;
                    cursor: pointer;
                    padding: 0 0.15rem;
                    transition: all 0.2s ease;
                }
                .highlight-yellow {
                    background-color: rgba(254, 240, 138, 0.45);
                    border-bottom: 2.5px solid rgba(234, 179, 8, 0.8);
                    color: #1c1917;
                }
                .highlight-yellow:hover {
                    background-color: rgba(254, 240, 138, 0.8);
                }
                .highlight-green {
                    background-color: rgba(167, 243, 208, 0.45);
                    border-bottom: 2.5px solid rgba(16, 185, 129, 0.8);
                    color: #064e3b;
                }
                .highlight-green:hover {
                    background-color: rgba(167, 243, 208, 0.8);
                }
                .highlight-blue {
                    background-color: rgba(191, 219, 254, 0.45);
                    border-bottom: 2.5px solid rgba(59, 130, 246, 0.8);
                    color: #1e3a8a;
                }
                .highlight-blue:hover {
                    background-color: rgba(191, 219, 254, 0.8);
                }
                .highlight-purple {
                    background-color: rgba(233, 213, 255, 0.45);
                    border-bottom: 2.5px solid rgba(168, 85, 247, 0.8);
                    color: #581c87;
                }
                .highlight-purple:hover {
                    background-color: rgba(233, 213, 255, 0.8);
                }
            `}</style>

            {/* Selection Popover UI */}
            <AnimatePresence>
                {selectedText && selectionCoords && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="fixed z-50 bg-[#1a1818] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 pointer-events-auto"
                        style={{
                            top: `${Math.max(10, selectionCoords.top)}px`,
                            left: `${selectionCoords.left}px`,
                            transform: 'translateX(-50%)',
                            width: '280px',
                        }}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Välj färg</span>
                            <div className="flex gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => setSelectedColor(color.id)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                            selectedColor === color.id ? 'border-white scale-105' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Lägg till anteckning (valfritt)</span>
                            <textarea
                                value={selectionNote}
                                onChange={(e) => setSelectionNote(e.target.value)}
                                placeholder="Skriv dina tankar..."
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-green-400 resize-none h-14"
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={clearSelection}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleCreateHighlight}
                                className="bg-[#50c878] text-[#1a1818] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#43a865] transition-colors"
                            >
                                Spara
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Highlight Tooltip UI */}
            <AnimatePresence>
                {tooltipNote && tooltipCoords && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="fixed z-50 bg-[#1a1818] border border-white/10 rounded-xl shadow-2xl p-3 text-xs text-white max-w-[240px] pointer-events-auto"
                        style={{
                            top: `${tooltipCoords.top}px`,
                            left: `${tooltipCoords.left}px`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div className="flex flex-col gap-2">
                            {tooltipNote.text && tooltipNote.text !== 'Highlight' && (
                                <p className="font-sans leading-relaxed text-white/90">
                                    {tooltipNote.text}
                                </p>
                            )}
                            <div className="flex justify-between items-center gap-4 mt-1 border-t border-white/10 pt-2">
                                <span className="text-[9px] text-white/40 uppercase font-sans">
                                    {new Date(tooltipNote.createdAt).toLocaleDateString('sv-SE')}
                                </span>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                            await deleteNoteMutation({ id: tooltipNote._id });
                                            setTooltipNote(null);
                                            setTooltipCoords(null);
                                        } catch (err) {
                                            console.error("Kunde inte radera anteckning:", err);
                                        }
                                    }}
                                    className="text-red-400 hover:text-red-300 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 hover:scale-105 transition-all"
                                >
                                    Radera
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ArticleReader;
