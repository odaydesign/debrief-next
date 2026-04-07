"use client";

import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const NotesView = ({ notes, articles, setActiveArticle }) => {
    // Group notes by article if desired, or show sequentially
    // Since mock notes have { id, articleId, text, createdAt }, we'll map them 
    // and find the corresponding article to display alongside.
    return (
        <div className="pb-32 px-6 pt-12 min-h-screen bg-stone-900 border-x border-stone-800 animate-in fade-in duration-500">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-serif text-cream tracking-tight mb-2">Mina anteckningar</h1>
                    <p className="text-stone-400 font-sans text-sm">Dina snabba tankar och höjdpunkter.</p>
                </div>
            </header>

            <div className="space-y-6">
                {notes.length === 0 ? (
                    <div className="text-center py-20 text-stone-500">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-sans">Inga anteckningar ännu. Lägg till anteckningar medan du läser artiklar.</p>
                    </div>
                ) : (
                    notes.map((note, idx) => {
                        const article = articles.find(a => a.id === note.articleId);
                        if (!article) return null; // Fallback if article not found

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={note.id}
                                className="bg-stone-800/60 border border-stone-700 rounded-2xl p-5 mb-4"
                            >
                                <div
                                    className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-700/50 cursor-pointer group"
                                    onClick={() => setActiveArticle(article)}
                                >
                                    <img src={article.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="text-cream font-bold text-sm truncate group-hover:text-green-400 transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-stone-400 text-xs">
                                            {new Date(note.createdAt).toLocaleDateString('sv-SE')}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-stone-500 group-hover:text-green-400 transition-colors" />
                                </div>
                                <p className="text-stone-300 font-sans text-sm leading-relaxed">
                                    {note.text}
                                </p>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default NotesView;
