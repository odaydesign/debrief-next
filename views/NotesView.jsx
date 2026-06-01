"use client";

import React from 'react';
import { FileText, ChevronRight, Trash2, Highlighter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, api } from '@/lib/db';
import { useMain } from '@/lib/MainContext';

const NotesView = ({ notes, articles, setActiveArticle }) => {
    const deleteNoteMutation = useMutation(api.notes.remove);
    const { user } = useMain();

    return (
        <div className="pb-32 px-6 pt-12 min-h-screen bg-bg animate-in fade-in duration-500">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-serif text-ink tracking-tight mb-2">Mina anteckningar</h1>
                    <p className="text-muted font-sans text-sm">Dina snabba tankar och höjdpunkter.</p>
                </div>
            </header>

            <div className="space-y-6">
                {notes.length === 0 ? (
                    <div className="text-center py-20 text-muted">
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
                                className="bg-card border border-line rounded-2xl p-5 mb-4 relative group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="flex items-center gap-3 pb-4 border-b border-line cursor-pointer group/item flex-1 overflow-hidden"
                                        onClick={() => setActiveArticle(article)}
                                    >
                                        <img src={article.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="text-ink font-bold text-sm truncate group-hover/item:text-accent transition-colors">
                                                {article.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-muted text-xs">
                                                    {new Date(note.createdAt).toLocaleDateString('sv-SE')}
                                                </p>
                                                {note.highlightText && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                        <Highlighter size={8} /> Highlight
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-muted group-hover/item:text-accent transition-colors shrink-0" />
                                    </div>

                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("Är du säker på att du vill radera denna anteckning?")) {
                                                await deleteNoteMutation({ id: note._id || note.id, userId: user?.id });
                                            }
                                        }}
                                        className="ml-3 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-surface transition-all opacity-0 group-hover:opacity-100"
                                        title="Radera anteckning"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {note.highlightText && (
                                    <div className={`pl-3 border-l-2 font-serif italic text-dek text-sm mb-3 ${
                                        note.color === 'green' ? 'border-emerald-400' :
                                        note.color === 'blue' ? 'border-blue-400' :
                                        note.color === 'purple' ? 'border-purple-400' : 'border-yellow-400'
                                    }`}>
                                        &ldquo;{note.highlightText}&rdquo;
                                    </div>
                                )}

                                {note.text && note.text !== 'Highlight' && (
                                    <p className="text-dek font-sans text-sm leading-relaxed">
                                        {note.text}
                                    </p>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default NotesView;
