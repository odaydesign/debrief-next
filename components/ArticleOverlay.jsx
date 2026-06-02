"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, Bookmark, StickyNote, Plus, Trash2, Play, BookOpen, Download, Headphones, ArrowUpRight } from 'lucide-react';
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
    const type = (card.type || 'news').toLowerCase();
    const source = card.source || card.author || 'Debrief';
    const articleLike = ['news', 'article', 'analysis', 'textonly', 'map', 'weather', 'profile'].includes(type);
    const stop = (e) => e.stopPropagation();

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

                        {/* title — most types show a headline; quote & stat render their own hero */}
                        {type !== 'quote' && type !== 'stat' && (
                            <>
                                <h1 className="font-serif text-[2rem] md:text-[2.6rem] leading-[1.08] tracking-tight mb-3">{card.title}</h1>
                                {dateStr && <p className="meta mb-7">{dateStr}</p>}
                            </>
                        )}

                        {/* ── type-specific hero ── */}
                        {type === 'twitter' && card.externalId ? (
                            <div data-theme="dark" className="w-full flex justify-center mb-8"><Tweet id={card.externalId} /></div>
                        ) : type === 'youtube' && card.externalId ? (
                            <div className="w-full aspect-video rounded-2xl overflow-hidden mb-9 shadow-lg bg-black">
                                <iframe src={`https://www.youtube.com/embed/${card.externalId}`} title={card.title} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            </div>
                        ) : (type === 'youtube' || type === 'video' || type === 'media') ? (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-line mb-9 bg-black/30">
                                {card.image && <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-80" />}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
                                    <span className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: '#e2563f' }}><Play size={24} fill="currentColor" /></span>
                                    {card.dur && <span className="meta" style={{ color: '#fff' }}>{card.dur}</span>}
                                </div>
                            </div>
                        ) : type === 'book' ? (
                            <div className="flex gap-6 items-start mb-9 flex-wrap">
                                <div className="hf-book shrink-0 w-[130px] aspect-[2/3] p-3.5 pl-4" style={{ background: `linear-gradient(135deg, ${card.c1 || '#6e4a3a'}, ${card.c2 || '#3a2620'})` }}>
                                    {card.author && <span className="font-mono text-[9px] tracking-wider text-white/70 mb-1.5">{card.author.split(' ').pop().toUpperCase()}</span>}
                                    <span className="font-serif text-white text-[16px] font-semibold leading-tight line-clamp-5">{card.title}</span>
                                </div>
                                <div className="flex-1 min-w-[180px]">
                                    <div className="meta mb-4">{[card.author, card.genre, card.time].filter(Boolean).join(' · ')}</div>
                                    <div className="flex gap-2.5 flex-wrap">
                                        {id && main?.toggleBookmark && <button onClick={() => main.toggleBookmark(id)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold active:scale-95"><BookOpen size={15} />{saved ? 'I läslistan' : 'Läslista'}</button>}
                                        <button onClick={stop} className="inline-flex items-center px-4 py-2.5 rounded-xl border border-line-strong text-sm font-semibold active:scale-95">Köp</button>
                                    </div>
                                </div>
                            </div>
                        ) : (type === 'document' || type === 'pdf' || type === 'file') ? (
                            <div className="mb-9">
                                <div className="border border-line rounded-2xl overflow-hidden">
                                    <div className="bg-surface px-4 py-3 flex items-center gap-3 border-b border-line">
                                        <span className="font-mono text-[10px] font-semibold text-white px-1.5 py-0.5 rounded" style={{ background: '#e2563f' }}>{String(card.filetype || (card.fileUrl ? card.fileUrl.split('.').pop() : '') || 'PDF').toUpperCase().slice(0, 4)}</span>
                                        <span className="font-mono text-xs flex-1 truncate">{card.fname || 'dokument.pdf'}</span>
                                        {card.filesize && <span className="meta">{card.filesize}</span>}
                                    </div>
                                    <div className="bg-card p-7 flex flex-col gap-2.5" style={{ aspectRatio: '1 / 1.2' }}>
                                        <div className="h-3 w-2/3 rounded bg-line-strong" />
                                        <div className="h-2 w-full rounded bg-line" />
                                        <div className="h-2 w-[94%] rounded bg-line" />
                                        <div className="h-2 w-[88%] rounded bg-line mb-2" />
                                        <div className="h-2 w-3/5 rounded bg-line" />
                                        <p className="meta text-center mt-auto">Sida 1 av {card.pages || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 mt-4">
                                    {card.fileUrl
                                        ? <a href={card.fileUrl} target="_blank" rel="noopener noreferrer" onClick={stop} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold active:scale-95"><Download size={15} /> Ladda ner</a>
                                        : <button onClick={stop} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold active:scale-95"><Download size={15} /> Ladda ner</button>}
                                    <button onClick={stop} className="inline-flex items-center px-4 py-2.5 rounded-xl border border-line-strong text-sm font-semibold active:scale-95">Förhandsgranska</button>
                                </div>
                            </div>
                        ) : type === 'podcast' ? (
                            <div className="mb-9 flex flex-col items-center text-center">
                                <div className="w-[150px] h-[150px] rounded-[22px] mb-5 flex items-center justify-center text-white shadow-2xl" style={{ background: 'linear-gradient(135deg,#9a7bd0,#5a4a7a)' }}><Headphones size={52} /></div>
                                <div className="meta mb-4">{[card.show || source, card.ep].filter(Boolean).join(' · ')}</div>
                                <div className="hf-wave h-[34px] w-full max-w-[320px] mb-2">{Array.from({ length: 40 }).map((_, k) => <i key={k} style={{ background: '#9a7bd0', opacity: 0.5, animationDelay: `${(k % 8) * 0.08}s` }} />)}</div>
                                <div className="flex items-center justify-between w-full max-w-[320px] meta mb-5"><span>0:00</span>{card.dur && <span>{card.dur}</span>}</div>
                                <div className="flex items-center justify-center gap-8">
                                    <span className="text-muted text-sm font-mono">↺15</span>
                                    <span className="w-14 h-14 rounded-full text-white flex items-center justify-center text-xl pl-0.5" style={{ background: '#9a7bd0' }}>▶</span>
                                    <span className="text-muted text-sm font-mono">30↻</span>
                                </div>
                            </div>
                        ) : type === 'link' ? (
                            <a href={card.url || card.sourceLink || '#'} target="_blank" rel="noopener noreferrer" onClick={stop} className="flex items-center gap-3 p-4 rounded-2xl border border-line bg-card hover:bg-surface transition-colors mb-9">
                                <span className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0" style={{ background: '#5aa9e6' }}><ArrowUpRight size={18} /></span>
                                <div className="flex-1 min-w-0"><div className="font-mono text-xs text-muted truncate">{card.domain || source}</div><div className="text-sm font-semibold">Öppna originalet</div></div>
                                <span className="text-muted">↗</span>
                            </a>
                        ) : type === 'quote' ? (
                            <div className="mb-9 mt-1">
                                <span className="font-serif text-accent text-[80px] leading-[0] block h-9 select-none">“</span>
                                <blockquote className="font-serif italic font-medium text-[1.9rem] md:text-[2.4rem] leading-[1.28] tracking-[-0.01em] mt-3">{card.title}</blockquote>
                                <div className="meta mt-6">— {source}{dateStr ? ` · ${dateStr}` : ''}</div>
                            </div>
                        ) : type === 'stat' ? (
                            <div className="mb-9 mt-1 text-center">
                                <div className="font-serif font-semibold text-[5rem] md:text-[6.5rem] leading-[0.85] tracking-[-0.04em] text-accent">{card.big || card.stat || card.value}</div>
                                {card.unit && <div className="meta mt-3">{card.unit}</div>}
                                <h1 className="font-serif text-[1.5rem] md:text-[1.9rem] leading-tight tracking-tight mt-5">{card.title}</h1>
                                <p className="meta mt-4">{source}{dateStr ? ` · ${dateStr}` : ''}</p>
                            </div>
                        ) : card.image ? (
                            <figure className="mb-9">
                                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-line"><img src={card.image} alt={card.title} className="w-full h-full object-cover" /></div>
                                <figcaption className="meta mt-2">Foto · {source}</figcaption>
                            </figure>
                        ) : null}

                        {/* lead — drop-cap for articles, plain for typed cards */}
                        {articleLike && lead && (
                            <p className="reader-body drop-cap font-serif text-[1.3rem] md:text-[1.45rem] leading-[1.55] mb-7">{lead}</p>
                        )}
                        {!articleLike && type !== 'quote' && type !== 'stat' && lead && (
                            <p className="reader-body text-[1.08rem] leading-relaxed mb-7">{lead}</p>
                        )}

                        {/* body */}
                        {body ? (
                            <div className="reader-body" dangerouslySetInnerHTML={{ __html: body }} />
                        ) : articleLike ? (
                            <div className="reader-body">
                                <p>I en era som definieras av snabba tekniska förändringar är förmågan att anpassa sig och förutse grundläggande skiften avgörande. Denna utveckling markerar en betydande milstolpe i det bredare landskapet och sätter nya riktmärken för innovation och operationell skala.</p>
                                <p>Analytiker tror att detta drag kommer att utlösa en kaskad av liknande strategier över hela branschen. "Vi bevittnar mognaden av koncept som var rent teoretiska för bara fem år sedan," noterade en ledande forskare.</p>
                                <p>Framöver planerar teamet att utöka sitt operationella fotavtryck avsevärt under de kommande 18 månaderna. Med resurserna nu säkrade skiftar fokus helt från att bevisa konceptet till att skala utförandet globalt.</p>
                            </div>
                        ) : null}

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
