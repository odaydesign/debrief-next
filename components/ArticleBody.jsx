"use client";

import React from 'react';
import { Play, BookOpen, Download, Headphones, ArrowUpRight } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { useMainOptional } from '@/lib/MainContext';

/**
 * The article itself — hero, title, lead, body and source link.
 * Shared by the reader overlay (bottom sheet) and the standalone /a/[id] page.
 *
 * Type hierarchy is deliberately quiet: one accent kicker (the tag), one
 * serif headline, one muted byline. Everything else is body text. Images are
 * treated as full-bleed heroes rather than framed inline boxes.
 */
const ArticleBody = ({ card }) => {
    const main = useMainOptional();

    const niceDate = card.date instanceof Date
        ? card.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })
        : card.date;
    const id = card.id || card._id;
    const saved = !!card.isBookmarked;
    const lead = card.description || card.summary;
    const body = card.fullText || card.content || "";
    const type = (card.type || 'news').toLowerCase();
    const source = card.source || card.author || 'Debrief';
    const tag = card.tag || card.category;
    const readTime = card.readTime ? String(card.readTime).trim() : null;
    const articleLike = ['news', 'article', 'analysis', 'textonly', 'map', 'weather', 'profile'].includes(type);
    // Types that carry their own source/meta in their hero don't need a byline.
    const showByline = !['quote', 'stat', 'book', 'podcast'].includes(type);
    const byline = [source, niceDate, readTime].filter(Boolean).join('  ·  ');
    const stop = (e) => e.stopPropagation();

    return (
        <>
            {/* Hero image — full-bleed, image-forward; no frame, no caption clutter */}
            {articleLike && card.image && (
                <div className="-mx-5 md:-mx-8 mb-7">
                    <div className="w-full aspect-[4/3] sm:aspect-[3/2] overflow-hidden rounded-2xl bg-surface">
                        <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${card.imageFocalX ?? 50}% ${card.imageFocalY ?? 50}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Header — one kicker, a generous headline, one quiet byline */}
            {type !== 'quote' && type !== 'stat' && (
                <header className="mb-8">
                    {tag && <p className="kicker mb-3">{tag}</p>}
                    <h1 className="font-serif text-[2.05rem] md:text-[2.7rem] leading-[1.06] tracking-[-0.015em] text-balance">{card.title}</h1>
                    {showByline && byline && (
                        <p className="mt-4 text-[13.5px] md:text-sm text-muted">{byline}</p>
                    )}
                </header>
            )}

            {/* ── type-specific hero ── */}
            {type === 'twitter' && card.externalId ? (
                <div data-theme="dark" className="w-full flex justify-center mb-8"><Tweet id={card.externalId} /></div>
            ) : type === 'youtube' && card.externalId ? (
                <div className="-mx-5 md:-mx-8 mb-9">
                    <div className="w-full aspect-video overflow-hidden rounded-2xl bg-black">
                        <iframe src={`https://www.youtube.com/embed/${card.externalId}`} title={card.title} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                </div>
            ) : (type === 'youtube' || type === 'video' || type === 'media') ? (
                <div className="-mx-5 md:-mx-8 mb-9">
                    <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-surface">
                        {card.image && <img src={card.image} alt={card.title} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/15">
                            <span className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: '#e2563f' }}><Play size={24} fill="currentColor" /></span>
                            {card.dur && <span className="meta" style={{ color: '#fff' }}>{card.dur}</span>}
                        </div>
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
                    <blockquote className="font-serif italic font-medium text-[1.9rem] md:text-[2.4rem] leading-[1.28] tracking-[-0.01em] text-balance mt-3">{card.title}</blockquote>
                    <div className="meta mt-6">— {source}{niceDate ? ` · ${niceDate}` : ''}</div>
                </div>
            ) : type === 'stat' ? (
                <div className="mb-9 mt-1 text-center">
                    <div className="font-serif font-semibold text-[5rem] md:text-[6.5rem] leading-[0.85] tracking-[-0.04em] text-accent">{card.big || card.stat || card.value}</div>
                    {card.unit && <div className="meta mt-3">{card.unit}</div>}
                    <h1 className="font-serif text-[1.5rem] md:text-[1.9rem] leading-tight tracking-tight text-balance mt-5">{card.title}</h1>
                    <p className="meta mt-4">{source}{niceDate ? ` · ${niceDate}` : ''}</p>
                </div>
            ) : (!articleLike && card.image) ? (
                <div className="-mx-5 md:-mx-8 mb-9">
                    <div className="w-full aspect-[3/2] overflow-hidden rounded-2xl bg-surface"><img src={card.image} alt={card.title} className="w-full h-full object-cover" /></div>
                </div>
            ) : null}

            {/* lead — a calm, larger standfirst (no drop-cap flourish) */}
            {articleLike && lead && (
                <p className="font-serif text-[1.28rem] md:text-[1.4rem] leading-[1.58] text-dek mb-8">{lead}</p>
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
                    <p>Analytiker tror att detta drag kommer att utlösa en kaskad av liknande strategier över hela branschen. ”Vi bevittnar mognaden av koncept som var rent teoretiska för bara fem år sedan”, noterade en ledande forskare.</p>
                    <p>Framöver planerar teamet att utöka sitt operationella fotavtryck avsevärt under de kommande 18 månaderna. Med resurserna nu säkrade skiftar fokus helt från att bevisa konceptet till att skala utförandet globalt.</p>
                </div>
            ) : null}

            {/* source link — a quiet inline link, not a shouty uppercase bar */}
            {card.sourceLink && (
                <div className="mt-10 pt-6 border-t border-line">
                    <a
                        href={card.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-accent hover:opacity-80 transition-opacity"
                    >
                        {card.sourceText || `Läs hela artikeln hos ${source}`}
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>
            )}
        </>
    );
};

export default ArticleBody;
