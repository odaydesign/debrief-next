"use client";

import React, { useState } from 'react';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { useMainOptional } from '@/lib/MainContext';
import { useQuery, useMutation, api } from '@/lib/db';

/**
 * "Mina anteckningar" — the personal notes block under an article.
 * Shared by the reader overlay and the standalone /a/[id] page.
 */
const ArticleNotes = ({ articleId }) => {
    const main = useMainOptional();
    const user = main?.user || null;

    const notes = useQuery(api.notes.getByArticle, user && articleId ? { articleId, userId: user.id } : "skip");
    const addNoteMutation = useMutation(api.notes.add);
    const removeNoteMutation = useMutation(api.notes.remove);
    const [noteText, setNoteText] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    const submitNote = async (e) => {
        e?.preventDefault?.();
        const t = noteText.trim();
        if (!t || !user || !articleId) return;
        setSavingNote(true);
        try {
            await addNoteMutation({ articleId, text: t, userId: user.id });
            setNoteText("");
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="mt-12 pt-7 border-t border-line">
            <div className="flex items-center gap-2 mb-4">
                <StickyNote size={15} className="text-accent" />
                <span className="meta" style={{ color: 'var(--ink)', letterSpacing: '0.14em' }}>Mina anteckningar</span>
                {notes?.length ? <span className="meta">{notes.length}</span> : null}
            </div>

            {user ? (
                <form onSubmit={submitNote} className="mb-5">
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Skriv en anteckning om den här artikeln…"
                        rows={3}
                        className="w-full bg-card border border-line rounded-xl p-3 text-[15px] leading-relaxed text-ink placeholder:text-muted resize-none focus:outline-none focus:border-accent"
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={!noteText.trim() || savingNote}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
                        >
                            <Plus size={14} /> {savingNote ? 'Sparar…' : 'Spara anteckning'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="meta mb-5">Logga in för att spara anteckningar.</p>
            )}

            <div className="flex flex-col gap-3">
                {(notes || []).map((n) => (
                    <div key={n._id} className="group bg-card border border-line rounded-xl p-3.5">
                        <div className="flex items-start gap-3">
                            <p className="flex-1 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{n.text}</p>
                            <button
                                onClick={() => removeNoteMutation({ id: n._id })}
                                aria-label="Radera anteckning"
                                className="shrink-0 text-muted hover:text-ink transition-colors md:opacity-0 md:group-hover:opacity-100 active:scale-90"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                        {n.createdAt && (
                            <p className="meta mt-2">{new Date(n.createdAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</p>
                        )}
                    </div>
                ))}
                {user && notes && notes.length === 0 && (
                    <p className="meta">Inga anteckningar än.</p>
                )}
            </div>
        </div>
    );
};

export default ArticleNotes;
