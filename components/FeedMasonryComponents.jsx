"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, FileText, Bookmark } from 'lucide-react';
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

const TYPE_LABEL = {
    news: 'Nyhet', youtube: 'Video', media: 'Media', twitter: 'Tråd',
    book: 'Bok', document: 'PDF', map: 'Karta', weather: 'Väder', profile: 'Profil',
};

// --- Editorial Card Renderer (shared across Feed / Archive / Search / Bookmarks) ---
export const CardContent = ({ data, featured = false }) => {
    const main = useMainOptional();
    const type = data.type || 'news';
    const tag = data.tag || data.category || TYPE_LABEL[type] || 'Brief';
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

    const onSave = (e) => {
        e.stopPropagation();
        main?.toggleBookmark?.(id);
    };

    const renderMedia = () => {
        if (type === 'twitter' && data.externalId) {
            return (
                <div data-theme="dark" className="w-full my-1 pointer-events-none"
                     style={{ '--tweet-bg-color': 'transparent', '--tweet-border': 'none' }}>
                    <Tweet id={data.externalId} />
                </div>
            );
        }
        if ((type === 'youtube' && data.externalId) || (type === 'media' && image)) {
            const src = type === 'youtube' && data.externalId
                ? `https://img.youtube.com/vi/${data.externalId}/maxresdefault.jpg`
                : image;
            return (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-line mb-3 mt-1 bg-black/20">
                    <img src={src} alt={title} className="w-full h-full object-cover"
                         style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="w-12 h-12 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white">
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                        </span>
                    </div>
                </div>
            );
        }
        if (type === 'book' && image) {
            return (
                <div className="w-full flex justify-center my-2">
                    <img src={image} alt={title} className="w-[120px] aspect-[2/3] object-cover rounded-md shadow-xl" />
                </div>
            );
        }
        if (type === 'document') {
            return (
                <div className="w-full border border-line rounded-xl p-4 flex items-center gap-3 mb-3 mt-1 bg-surface">
                    <FileText className="w-6 h-6 text-accent shrink-0" />
                    <span className="meta">{data.fileUrl ? (data.fileUrl.split('.').pop() || 'DOCUMENT') : 'DOCUMENT'}</span>
                </div>
            );
        }
        if (type === 'map' && image) {
            return (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-line mb-3 mt-1">
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                </div>
            );
        }
        if (image) {
            return (
                <div className={`w-full ${featured ? 'aspect-[3/2]' : 'aspect-[16/10]'} rounded-xl overflow-hidden border border-line mb-3 mt-1`}>
                    <img src={image} alt={title} className="w-full h-full object-cover"
                         style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }} />
                </div>
            );
        }
        return null;
    };

    const isPlainTweet = type === 'twitter' && !data.externalId;

    return (
        <article className={`relative bg-card text-ink border border-line rounded-2xl overflow-hidden h-full ${data.isMustRead ? 'must-spine' : ''}`}>
            <div className="p-4 md:p-5 flex flex-col h-full text-left">
                {/* topline */}
                <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="chip"><span className="chip-dot" />{tag}</span>
                    {data.isMustRead && <span className="meta text-accent">Måste läsas</span>}
                </div>

                {isPlainTweet ? (
                    <p className="font-serif text-lg leading-snug">
                        {description || data.content?.replace(/<[^>]*>?/gm, '')}
                    </p>
                ) : (
                    <>
                        <h2 className={`font-serif leading-[1.14] tracking-tight mb-2 ${featured ? 'text-[1.7rem] md:text-[2.1rem]' : 'text-[1.32rem] md:text-[1.4rem]'}`}>
                            {title}
                        </h2>
                        {description && (
                            <p className="text-[14px] leading-relaxed text-dek line-clamp-3">{description}</p>
                        )}
                    </>
                )}

                {/* data + actions — above the image */}
                <div className="mt-3 pt-3 mb-3 flex items-center gap-2.5 border-t border-line">
                    <span className="meta flex-1 min-w-0 truncate">
                        {source}{dateStr ? ` · ${dateStr}` : ''}
                    </span>
                    {showSave && (
                        <button
                            onClick={onSave}
                            aria-label={saved ? 'Ta bort bokmärke' : 'Spara'}
                            className={`pointer-events-auto shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors active:scale-90 ${
                                saved ? 'bg-accent border-accent text-accent-ink' : 'border-line text-muted hover:text-ink'
                            }`}
                        >
                            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>

                {/* image — anchored at the bottom */}
                {renderMedia()}
            </div>
        </article>
    );
};
