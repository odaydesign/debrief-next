"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, Bookmark, StickyNote, Plus, Trash2 } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { useMainOptional } from '@/lib/MainContext';
import { useQuery, useMutation, api } from '@/lib/db';

const ArticleOverlay = ({ card, isOpen, onClose }) => {
    const scrollRef = useRef(null);
    const panelRef = useRef(null);
    const backdropRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const main = useMainOptional();

    // ── Article notes ──────────────────────────────────────────────────────
    const user = main?.user || null;
    const articleId = card?.id || card?._id || null;
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

    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    // Lock page scroll + reset reader scroll/transform when opening.
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            if (panelRef.current) { panelRef.current.classList.remove('sheet-dragging'); panelRef.current.style.transform = ''; }
            if (backdropRef.current) backdropRef.current.style.opacity = '';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    // Native swipe-up / swipe-down to close (non-passive so we can preventDefault).
    useEffect(() => {
        const scroller = scrollRef.current;
        const panel = panelRef.current;
        const backdrop = backdropRef.current;
        if (!scroller || !panel) return;

        let startY = 0, dy = 0, mode = null, startedOnControl = false;
        const atTop = () => scroller.scrollTop <= 0;
        const atBottom = () => scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
        const reset = () => {
            panel.classList.remove('sheet-dragging');
            panel.style.transform = '';
            if (backdrop) backdrop.style.opacity = '';
            mode = null; dy = 0;
        };
        const onStart = (e) => {
            if (e.touches.length !== 1) return;
            startedOnControl = !!(e.target.closest && e.target.closest('textarea, input, button, a, [data-no-swipe]'));
            startY = e.touches[0].clientY; dy = 0; mode = null;
        };
        const onMove = (e) => {
            if (startedOnControl) return;
            dy = e.touches[0].clientY - startY;
            if (mode === null) {
                if (dy > 4 && atTop()) mode = 'down';
                else if (dy < -4 && atBottom()) mode = 'up';
                else return;
                panel.classList.add('sheet-dragging');
            }
            const h = panel.clientHeight || window.innerHeight;
            if (mode === 'down') {
                if (scroller.scrollTop > 0) { reset(); return; }
                e.preventDefault();
                panel.style.transform = `translateY(${Math.max(0, dy)}px)`;
                if (backdrop) backdrop.style.opacity = String(Math.max(0, 1 - dy / h * 1.25));
            } else {
                e.preventDefault();
                panel.style.transform = `translateY(${Math.min(0, dy) * 0.45}px)`;
                if (backdrop) backdrop.style.opacity = String(Math.max(0.4, 1 - (-dy) / h));
            }
        };
        const onEnd = () => {
            if (mode === null) return;
            const h = panel.clientHeight || window.innerHeight;
            const close = (mode === 'down' && dy > Math.min(150, h * 0.2)) || (mode === 'up' && -dy > 100);
            if (close) {
                if (navigator.vibrate) { try { navigator.vibrate(10); } catch { /* ignore */ } }
                reset();
                onCloseRef.current?.();
            } else {
                reset();
            }
        };

        scroller.addEventListener('touchstart', onStart, { passive: true });
        scroller.addEventListener('touchmove', onMove, { passive: false });
        scroller.addEventListener('touchend', onEnd);
        scroller.addEventListener('touchcancel', reset);
        return () => {
            scroller.removeEventListener('touchstart', onStart);
            scroller.removeEventListener('touchmove', onMove);
            scroller.removeEventListener('touchend', onEnd);
            scroller.removeEventListener('touchcancel', reset);
        };
    }, [card]);

    if (!card) return null;

    const tag = card.tag || card.category;
    const dateStr = card.date instanceof Date ? card.date.toLocaleDateString('sv-SE') : card.date;
    const id = card.id || card._id;
    const saved = !!card.isBookmarked;
    const lead = card.description || card.summary;
    const body = card.fullText || card.content || "";

    return (
        <div className={`fixed inset-0 z-50 flex items-end justify-center ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>

            {/* Dimmed Backdrop */}
            <div
                ref={backdropRef}
                className={`absolute inset-0 bg-black/55 backdrop-blur-md transition-opacity duration-[600ms] ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Sliding Article Panel */}
            <div
                ref={panelRef}
                className={`relative w-full max-w-[760px] h-[94vh] bg-bg text-ink rounded-t-[1.75rem] border-t border-line shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden transition-transform duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Scrollable Article Content (also the swipe surface) */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar" style={{ touchAction: 'pan-y' }}>
                    <div className="sheet-grab"><span /></div>

                    <div className="max-w-[680px] mx-auto px-5 md:px-8 pb-32 pt-1">
                        {/* topline: chip + close */}
                        <div className="flex items-center justify-between mb-5">
                            {tag ? <span className="chip"><span className="chip-dot" />{tag}</span> : <span />}
                            <button
                                onClick={onClose}
                                aria-label="Stäng"
                                className="w-9 h-9 rounded-full border border-line bg-card text-ink flex items-center justify-center hover:bg-surface transition-colors active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <h1 className="font-serif text-[2rem] md:text-[2.6rem] leading-[1.08] tracking-tight mb-3">
                            {card.title}
                        </h1>
                        {dateStr && <p className="meta mb-7">{dateStr}</p>}

                        {/* media */}
                        {card.type === 'twitter' && card.externalId && (
                            <div data-theme="dark" className="w-full flex justify-center mb-8">
                                <Tweet id={card.externalId} />
                            </div>
                        )}
                        {card.type === 'youtube' && card.externalId && (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden mb-9 shadow-lg bg-black">
                                <iframe
                                    src={`https://www.youtube.com/embed/${card.externalId}`}
                                    title={card.title}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        )}
                        {!((card.type === 'youtube' || card.type === 'twitter') && card.externalId) && card.image && (
                            <figure className="mb-9">
                                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-line">
                                    <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                </div>
                                <figcaption className="meta mt-2">Foto · {card.source || 'Debrief'}</figcaption>
                            </figure>
                        )}

                        {/* lead */}
                        {lead && (
                            <p className="reader-body drop-cap font-serif text-[1.3rem] md:text-[1.45rem] leading-[1.55] mb-7">
                                {lead}
                            </p>
                        )}

                        {/* body */}
                        {body ? (
                            <div className="reader-body" dangerouslySetInnerHTML={{ __html: body }} />
                        ) : (
                            <div className="reader-body">
                                <p>I en era som definieras av snabba tekniska förändringar är förmågan att anpassa sig och förutse grundläggande skiften avgörande. Denna utveckling markerar en betydande milstolpe i det bredare landskapet och sätter nya riktmärken för innovation och operationell skala.</p>
                                <p>Analytiker tror att detta drag kommer att utlösa en kaskad av liknande strategier över hela branschen. "Vi bevittnar mognaden av koncept som var rent teoretiska för bara fem år sedan," noterade en ledande forskare.</p>
                                <p>Framöver planerar teamet att utöka sitt operationella fotavtryck avsevärt under de kommande 18 månaderna. Med resurserna nu säkrade skiftar fokus helt från att bevisa konceptet till att skala utförandet globalt.</p>
                            </div>
                        )}

                        {card.sourceLink && (
                            <div className="mt-10 pt-7 border-t border-line">
                                <a
                                    href={card.sourceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent hover:opacity-70 transition-opacity"
                                >
                                    {card.sourceText || 'Till källan'} ↗
                                </a>
                            </div>
                        )}

                        {/* notes */}
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

                        {/* reading-end footer */}
                        <div className="mt-12 pt-7 border-t border-line">
                            <p className="meta text-center text-faint tracking-[0.25em] mb-5">— SLUT —</p>
                            <div className="flex items-center gap-3">
                                {id && main?.toggleBookmark && (
                                    <button
                                        onClick={() => main.toggleBookmark(id)}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors active:scale-95 ${saved ? 'bg-accent border-accent text-accent-ink' : 'border-line text-ink hover:bg-surface'}`}
                                    >
                                        <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                                        {saved ? 'Sparad' : 'Spara'}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95"
                                >
                                    Stäng ↓
                                </button>
                            </div>
                            <p className="meta text-center text-faint mt-5">Svep upp eller ner för att stänga</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleOverlay;
