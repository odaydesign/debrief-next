"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Bookmark, BookOpen, Download, ArrowUpRight, Headphones } from 'lucide-react';
import { useMainOptional } from '@/lib/MainContext';
import { Tweet } from 'react-tweet';

// --- Intersection Observer Hook for Entry Animations ---
export function useCardAnimation(ref) {
    const [state, setState] = useState({ isVisible: false });

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setState({ isVisible: true });
            },
            { threshold: 0, rootMargin: "-60px 0px -60px 0px" }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);

    return state;
}

// --- Animation Wrapper Component ---
export const FadeInCard = ({ children, index, onClick }) => {
    const ref = useRef(null);
    const { isVisible } = useCardAnimation(ref);
    const [hasEntered, setHasEntered] = useState(false);

    useEffect(() => {
        if (isVisible) setHasEntered(true);
    }, [isVisible]);

    const delay = !hasEntered && index < 10 ? `${(index % 5) * 70}ms` : '0ms';

    return (
        <div ref={ref} className="break-inside-avoid mb-4">
            <div
                onClick={onClick}
                className="will-change-transform cursor-pointer"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(18px)',
                    transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                    transitionDelay: delay,
                }}
            >
                <div className="transition-transform duration-200 active:scale-[0.985] md:hover:-translate-y-1 h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

// type → fallback chip label + chip-dot color (the layout itself signals the type)
const TYPE_META = {
    news:    { label: 'Nyhet',  dot: 'var(--accent)' },
    article: { label: 'Artikel', dot: 'var(--accent)' },
    analysis:{ label: 'Analys', dot: 'var(--accent)' },
    youtube: { label: 'Video',  dot: '#e2563f' },
    media:   { label: 'Video',  dot: '#e2563f' },
    video:   { label: 'Video',  dot: '#e2563f' },
    book:    { label: 'Bok',    dot: '#e0a800' },
    document:{ label: 'PDF',    dot: '#e2563f' },
    pdf:     { label: 'PDF',    dot: '#e2563f' },
    file:    { label: 'Fil',    dot: '#e2563f' },
    quote:   { label: 'Citat',  dot: '#9a7bd0' },
    twitter: { label: 'Tråd',   dot: '#5aa9e6' },
    link:    { label: 'Länk',   dot: '#5aa9e6' },
    stat:    { label: 'Siffra', dot: 'var(--accent)' },
    podcast: { label: 'Podd',   dot: '#9a7bd0' },
    map:     { label: 'Karta',  dot: '#5aa9e6' },
    weather: { label: 'Väder',  dot: '#5aa9e6' },
    profile: { label: 'Profil', dot: 'var(--accent)' },
};

// --- Editorial Card Renderer (shared across Feed / Archive / Search / Bookmarks) ---
export const CardContent = ({ data, featured = false }) => {
    const main = useMainOptional();
    const type = (data.type || 'news').toLowerCase();
    const meta = TYPE_META[type] || TYPE_META.news;
    const tag = data.tag || data.category || meta.label;
    const title = data.title;
    const description = data.description || data.summary;
    const image = data.image;
    const source = data.source || data.author || 'Debrief';
    const dateStr = data.date instanceof Date
        ? data.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
        : data.date;
    const saved = !!data.isBookmarked;
    const id = data.id || data._id;
    const showSave = !!(id && main?.toggleBookmark);
    const onSave = (e) => { e.stopPropagation(); main?.toggleBookmark?.(id); };
    const stop = (e) => e.stopPropagation();

    // ── shared bits ──
    const Chip = (extra) => (
        <div className="flex items-center gap-2.5 mb-2.5">
            <span className="chip"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: meta.dot }} />{tag}</span>
            {data.isMustRead && <span className="meta text-accent">Måste läsas</span>}
            {extra}
        </div>
    );
    const saveBtn = showSave ? (
        <button onClick={onSave} aria-label={saved ? 'Ta bort bokmärke' : 'Spara'}
            className={`pointer-events-auto shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors active:scale-90 ${saved ? 'bg-accent border-accent text-accent-ink' : 'border-line text-muted hover:text-ink'}`}>
            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
        </button>
    ) : null;
    const footer = (cls = '') => (
        <div className={`flex items-center gap-2.5 pt-3 border-t border-line ${cls}`}>
            <span className="meta flex-1 min-w-0 truncate">{source}{dateStr ? ` · ${dateStr}` : ''}</span>
            {saveBtn}
        </div>
    );
    const headline = (cls) => (
        <h2 className={`font-serif leading-[1.14] tracking-tight mb-2 ${cls || (featured ? 'text-[1.7rem] md:text-[2.1rem]' : 'text-[1.32rem] md:text-[1.4rem]')}`}>{title}</h2>
    );
    const dek = (cls = 'line-clamp-3') => description ? <p className={`text-[14px] leading-relaxed text-dek ${cls}`}>{description}</p> : null;
    const shell = (children) => (
        <article className={`relative bg-card text-ink border border-line rounded-2xl overflow-hidden h-full ${data.isMustRead ? 'must-spine' : ''}`}>
            <div className="p-4 md:p-5 flex flex-col h-full text-left">{children}</div>
        </article>
    );
    const cta = (label, solid = true, href) => {
        const cls = `pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${solid ? 'bg-accent text-accent-ink' : 'border border-line-strong text-ink'}`;
        return href
            ? <a href={href} target="_blank" rel="noopener noreferrer" onClick={stop} className={cls}>{label}</a>
            : <button onClick={stop} className={cls}>{label}</button>;
    };

    // ── BOOK ──
    if (type === 'book') {
        const author = data.author || '';
        const c1 = data.c1 || '#6e4a3a', c2 = data.c2 || '#3a2620';
        return shell(<>
            {Chip()}
            <div className="flex gap-4 items-start">
                <div className="hf-book shrink-0 w-[84px] aspect-[2/3] p-2.5 pl-3.5" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {author && <span className="font-mono text-[7.5px] tracking-wider text-white/70 mb-1">{author.split(' ').pop().toUpperCase()}</span>}
                    <span className="font-serif text-white text-[12px] font-semibold leading-tight line-clamp-4">{title}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-[1.16rem] leading-tight tracking-tight mb-1">{title}</h2>
                    <div className="meta mb-2">{[author, data.genre, data.time].filter(Boolean).join(' · ')}</div>
                    {dek('line-clamp-2 text-[13.5px]')}
                    <div className="flex gap-2 mt-3">
                        {showSave && <button onClick={onSave} className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-ink text-xs font-semibold active:scale-95"><BookOpen size={13} />{saved ? 'Sparad' : 'Läslista'}</button>}
                        {cta('Köp', false)}
                    </div>
                </div>
            </div>
            {footer('mt-auto')}
        </>);
    }

    // ── QUOTE ──
    if (type === 'quote') {
        return shell(<>
            {Chip()}
            <div className="relative pt-1">
                <span className="font-serif text-accent text-[52px] leading-[0] block h-6 select-none">“</span>
                <blockquote className="font-serif italic font-medium text-[1.5rem] leading-[1.32] tracking-[-0.01em] mt-2">{title}</blockquote>
            </div>
            {footer('mt-auto pt-3')}
        </>);
    }

    // ── STAT ──
    if (type === 'stat') {
        const big = data.big || data.stat || data.value;
        return shell(<>
            {Chip()}
            <div className="flex items-baseline gap-3.5">
                <div className="font-serif font-semibold text-[3.2rem] leading-[0.9] tracking-[-0.03em] text-accent shrink-0">{big || title}</div>
                {big && (
                    <div className="flex-1 min-w-0">
                        {data.unit && <div className="meta mb-1">{data.unit}</div>}
                        <h2 className="font-serif text-[1.05rem] font-medium leading-[1.25]">{title}</h2>
                    </div>
                )}
            </div>
            {dek('mt-3')}
            {footer('mt-auto')}
        </>);
    }

    // ── LINK ──
    if (type === 'link') {
        let domain = data.domain;
        if (!domain && data.url) { try { domain = new URL(data.url).hostname.replace(/^www\./, ''); } catch { /* noop */ } }
        domain = domain || source;
        return shell(<>
            <div className="flex items-center gap-2 mb-2.5">
                <span className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center text-white" style={{ background: '#5aa9e6' }}><ArrowUpRight size={11} /></span>
                <span className="meta">{domain}</span>
                <span className="chip ml-auto"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: meta.dot }} />{meta.label}</span>
            </div>
            {headline('text-[1.2rem]')}
            {dek()}
            {footer('mt-3')}
        </>);
    }

    // ── PDF / FILE / DOCUMENT ──
    if (type === 'document' || type === 'pdf' || type === 'file') {
        const ext = String(data.filetype || (data.fileUrl ? data.fileUrl.split('.').pop() : '') || 'PDF').toUpperCase().slice(0, 4);
        return shell(<>
            {Chip()}
            <h2 className="font-serif text-[1.18rem] leading-tight tracking-tight mb-3">{title}</h2>
            <div className="flex gap-3.5 items-center">
                <div className="relative shrink-0 w-14 h-[70px] rounded-md bg-surface border border-line-strong flex items-end justify-center pb-2.5">
                    <span className="font-mono text-[9px] font-semibold text-white px-1.5 py-px rounded" style={{ background: '#e2563f' }}>{ext}</span>
                </div>
                <div className="flex-1 min-w-0">
                    {data.fname && <div className="font-mono text-[11px] text-muted truncate">{data.fname}</div>}
                    <div className="meta mt-1">{[ext, data.filesize, data.pages && `${data.pages} sidor`].filter(Boolean).join(' · ')}</div>
                    <div className="mt-2.5">{cta(<><Download size={13} /> Ladda ner</>, true, data.fileUrl)}</div>
                </div>
            </div>
            {footer('mt-auto')}
        </>);
    }

    // ── PODCAST ──
    if (type === 'podcast') {
        const bars = Array.from({ length: 16 });
        return shell(<>
            {Chip(data.ep && <span className="meta">{data.ep}</span>)}
            <h2 className="font-serif text-[1.18rem] leading-tight tracking-tight mb-3">{title}</h2>
            <div className="flex gap-3.5 items-center">
                <div className="shrink-0 w-[66px] h-[66px] rounded-[13px] flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#9a7bd0,#5a4a7a)' }}><Headphones size={24} /></div>
                <div className="flex-1 flex items-center gap-3">
                    <span className="shrink-0 w-[30px] h-[30px] rounded-full text-white flex items-center justify-center text-xs pl-0.5" style={{ background: '#9a7bd0' }}>▶</span>
                    <div className="hf-wave h-[22px] flex-1 max-w-[150px]">{bars.map((_, k) => <i key={k} style={{ background: '#9a7bd0', opacity: 0.55, animationDelay: `${(k % 6) * 0.1}s` }} />)}</div>
                    {data.dur && <span className="meta">{data.dur}</span>}
                </div>
            </div>
            {footer('mt-auto')}
        </>);
    }

    // ── VIDEO (youtube / media / video) ──
    if (type === 'youtube' || type === 'media' || type === 'video') {
        const thumb = type === 'youtube' && data.externalId
            ? `https://img.youtube.com/vi/${data.externalId}/maxresdefault.jpg`
            : image;
        return shell(<>
            {Chip(data.channel && <span className="meta truncate">{data.channel}</span>)}
            {headline()}
            {dek()}
            {footer('mt-3 mb-3')}
            {thumb ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-line bg-black/20">
                    <img src={thumb} alt={title} className="w-full h-full object-cover" style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-12 h-12 rounded-full bg-black/55 backdrop-blur border border-white/25 flex items-center justify-center text-white text-base pl-0.5">▶</span>
                    </div>
                    {data.dur && <span className="absolute right-2 bottom-2 bg-black/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">{data.dur}</span>}
                </div>
            ) : (
                <div className="w-full aspect-video rounded-xl border border-line flex flex-col items-center justify-center gap-2"
                     style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgba(226,86,63,.22), transparent 70%), var(--surface)' }}>
                    <span className="w-11 h-11 rounded-full text-white flex items-center justify-center text-base pl-0.5" style={{ background: '#e2563f' }}><Play size={18} fill="currentColor" /></span>
                    {data.dur && <span className="meta">Spela · {data.dur}</span>}
                </div>
            )}
        </>);
    }

    // ── TWITTER / THREAD ──
    if (type === 'twitter') {
        if (data.externalId) {
            return shell(<>
                {Chip()}
                <div data-theme="dark" className="w-full pointer-events-none" style={{ '--tweet-bg-color': 'transparent', '--tweet-border': 'none' }}>
                    <Tweet id={data.externalId} />
                </div>
                {footer('mt-3 mt-auto')}
            </>);
        }
        return shell(<>
            {Chip()}
            <p className="font-serif text-lg leading-snug">{description || data.content?.replace(/<[^>]*>?/gm, '')}</p>
            {footer('mt-3 mt-auto')}
        </>);
    }

    // ── DEFAULT: ARTICLE / NEWS / MAP / WEATHER / PROFILE (text → image below) ──
    return shell(<>
        {Chip()}
        {headline()}
        {dek()}
        {image ? footer('mt-3 mb-3') : footer('mt-auto')}
        {image && (
            <div className={`w-full ${type === 'map' ? 'aspect-video' : featured ? 'aspect-[3/2]' : 'aspect-[16/10]'} rounded-xl overflow-hidden border border-line`}>
                <img src={image} alt={title} className="w-full h-full object-cover"
                     style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }} />
            </div>
        )}
    </>);
};
