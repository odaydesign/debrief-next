"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Sun, Plus, X, Play, BookOpen, FileText } from 'lucide-react';

// Twitter/X icon (removed from lucide-react)
const TwitterIcon = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { Tweet } from 'react-tweet';

// --- Intersection Observer Hook for Entry Animations ---
export function useCardAnimation(ref, rootMargin = '0px') {
    const [state, setState] = useState({ isVisible: false, origin: 'bottom' });

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                const isBelowCenter = entry.boundingClientRect.top > window.innerHeight / 2;
                if (entry.isIntersecting) {
                    setState(prev => ({ ...prev, isVisible: true }));
                } else {
                    setState({ isVisible: false, origin: isBelowCenter ? 'bottom' : 'top' });
                }
            },
            { threshold: 0, rootMargin: "-75px 0px -75px 0px" }
        );

        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setState({ isVisible: false, origin: rect.top > window.innerHeight / 2 ? 'bottom' : 'top' });
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.disconnect();
        };
    }, [ref, rootMargin]);

    return state;
}

// --- Animation Wrapper Component ---
export const FadeInCard = ({ children, index, onClick }) => {
    const ref = useRef(null);
    const { isVisible, origin } = useCardAnimation(ref);
    const [hasEntered, setHasEntered] = useState(false);

    useEffect(() => {
        if (isVisible) setHasEntered(true);
    }, [isVisible]);

    // Subtle flip effect: increased rotateX and Z-depth
    const hiddenTransform = origin === 'bottom'
        ? 'translate3d(0, 100px, -100px) scale(0.9) rotateX(45deg)'
        : 'translate3d(0, -100px, -100px) scale(0.9) rotateX(-45deg)';

    const delay = !hasEntered && index < 12 ? `${(index % 4) * 150}ms` : '0ms';

    return (
        <div ref={ref} className="break-inside-avoid mb-6" style={{ perspective: '1200px' }}>
            <div
                onClick={onClick}
                className="will-change-transform cursor-pointer"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translate3d(0, 0, 0) scale(1) rotateX(0deg)' : hiddenTransform,
                    // Added a subtle overshoot/spring curve (cubic-bezier) for a realistic flipping settlement
                    transition: 'opacity 0.7s ease-out, transform 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
                    transitionDelay: delay,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center center'
                }}
            >
                <div className="transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] rounded-[2rem] h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Sub-components for Card Elements ---
const CardTag = ({ text, styleClass }) => {
    if (!text) return null;
    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 inline-block ${styleClass}`}>
            {text}
        </span>
    );
};

const CardButton = ({ text, textColor, icon }) => {
    if (!text && !icon) return null;
    return (
        <button className={`mt-8 px-6 py-2.5 rounded-full border border-current text-xs font-bold tracking-wider uppercase hover:opacity-70 transition-opacity pointer-events-none ${icon ? 'w-10 h-10 flex items-center justify-center p-0' : ''} ${textColor}`}>
            {icon ? icon : text}
        </button>
    );
};

// --- Main Card Renderer ---
export const CardContent = ({ data }) => {
    // Map existing article data to this format, or use it directly
    const type = data.type || 'news';
    const tag = data.tag || data.category;
    const tagStyle = data.tagStyle || 'bg-[#50c878] text-white';
    const title = data.title;
    const description = data.description || data.summary;
    const buttonText = data.buttonText || 'READ MORE';
    const bgColor = data.bgColor || 'bg-[#f6f4f1]';
    const textColor = data.textColor || 'text-[#2a2726]';
    const image = data.image;
    const date = data.date instanceof Date ? data.date.toLocaleDateString() : data.date;
    const iconName = data.icon;
    const visual = data.visual;
    const imageType = data.imageType;
    const time = data.time;
    const location = data.location;

    const baseClasses = `relative rounded-[2rem] p-8 md:p-10 flex flex-col items-center text-center overflow-hidden h-full ${bgColor} ${textColor}`;

    const renderVisual = () => {
        if (visual === 'dots') return <div className="flex gap-4 mb-10"><div className="w-10 h-10 rounded-full bg-[#3ab065]"></div><div className="w-10 h-10 rounded-full bg-[#3ab065]"></div><div className="w-10 h-10 rounded-full bg-[#3ab065]"></div></div>;
        if (visual === 'squares') return <div className="grid grid-cols-2 gap-2 mb-10 opacity-80"><div className="w-16 h-16 rounded-lg bg-[#b8a30e]"></div><div className="w-8 h-8 rounded-md bg-[#b8a30e] self-end"></div><div className="w-12 h-12 rounded-lg bg-[#b8a30e] justify-self-end"></div></div>;
        return null;
    };

    const renderIllustration = () => {
        if (imageType === 'illustration-sakana-1') {
            return (
                <div className="bg-white rounded-xl p-6 w-full mb-6 mt-6 relative aspect-square flex items-center justify-center border border-gray-100">
                    <div className="grid grid-cols-3 gap-4 opacity-70">
                        {[...Array(5)].map((_, i) => <div key={`sak1-${i}`} className="w-12 h-12 bg-gray-200" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', transform: `rotate(${i * 45}deg)` }}></div>)}
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white"><span className="text-xs font-bold">AI</span></div>
                    </div>
                </div>
            )
        }
        if (imageType === 'cards-stack') {
            return (
                <div className="relative w-48 h-32 mb-8 mt-12">
                    <div className="absolute inset-0 bg-[#e85d4e] rounded-xl transform rotate-6 scale-105 opacity-50"></div>
                    <div className="absolute inset-0 bg-[#f4a261] rounded-xl transform -rotate-3 scale-105 opacity-80"></div>
                    <div className="absolute inset-0 bg-[#e9c46a] rounded-xl z-10 border-4 border-[#3b3635]"></div>
                </div>
            )
        }
        return null;
    }

    const IconComponent = iconName === 'Cloud' ? <Cloud className="w-10 h-10 mb-4" /> :
        iconName === 'Sun' ? <Sun className="w-10 h-10 mb-4 text-white" /> :
            iconName === 'Plus' ? <Plus className="w-4 h-4" /> :
                type === 'youtube' ? <Play className="w-12 h-12 ml-1 text-[#ff0000]" fill="currentColor" /> :
                    type === 'twitter' ? <TwitterIcon className="w-8 h-8 opacity-80" /> :
                        type === 'book' ? <BookOpen className="w-8 h-8 opacity-80" /> :
                            type === 'document' ? <FileText className="w-8 h-8 opacity-80" /> : null;

    return (
        <div className={baseClasses}>
            {type === 'weather' && IconComponent}
            {/* Twitter Embed or Fallback */}
            {type === 'twitter' && data.externalId ? (
                <div
                    data-theme={textColor.includes('white') ? 'dark' : 'light'}
                    className="w-full flex flex-col items-center justify-center pointer-events-none mt-[-1rem]"
                    style={{
                        '--tweet-bg-color': 'transparent',
                        '--tweet-bg-color-hover': 'rgba(128,128,128,0.1)',
                        '--tweet-border': 'none',
                    }}
                >
                    <Tweet id={data.externalId} />
                </div>
            ) : type === 'twitter' ? (
                <>
                    <div className="w-full flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="font-bold text-sm">X</span>
                            </div>
                            <div className="text-left leading-tight">
                                <div className="font-bold text-sm">{title}</div>
                                <div className="text-xs opacity-50">@{data.externalId || 'author'}</div>
                            </div>
                        </div>
                        {IconComponent}
                    </div>
                    <p className={`text-xl font-sans leading-relaxed text-left w-full ${type === 'profile' ? 'max-w-[250px]' : ''}`}>
                        {description || data.content?.replace(/<[^>]*>?/gm, '')}
                    </p>
                </>
            ) : null}

            {/* Standard Title & Tags */}
            {(type !== 'twitter' || data.externalId) && (
                <>
                    {tag && <CardTag text={tag} styleClass={tagStyle} />}
                    {renderVisual()}
                    <h2 className={`${data.fontSize || 'font-serif'} ${type === 'weather' ? 'text-3xl' : (data.fontSize ? '' : 'text-[1.75rem]')} leading-tight mb-4 tracking-tight`}>
                        {title}
                    </h2>
                </>
            )}

            {/* Document/File Display */}
            {type === 'document' && (
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center mb-6 mt-4 hover:bg-white/10 transition-colors">
                    {IconComponent}
                    <div className="text-xs font-bold uppercase tracking-widest mt-4 opacity-70">
                        {data.fileUrl ? data.fileUrl.split('.').pop() || 'DOCUMENT' : 'DOCUMENT'}
                    </div>
                </div>
            )}

            {type === 'map' && image && (
                <div className="w-full relative mt-4 mb-6">
                    <img src={image} alt={location || 'Map'} className="w-full h-48 object-cover rounded-2xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur text-black px-4 py-1 rounded-full text-xs font-bold shadow-sm">NEW YORK CITY</div>
                    </div>
                </div>
            )}

            {/* YouTube/Media Player Display */}
            {((type === 'media' && image) || (type === 'youtube' && data.externalId)) && (
                <div className="relative mb-6 w-full mt-4 group">
                    <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                        <img
                            src={type === 'youtube' && data.externalId ? `https://img.youtube.com/vi/${data.externalId}/maxresdefault.jpg` : image}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }}
                        />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-2xl scale-100 group-hover:scale-110 transition-transform">
                            {type === 'youtube' ? <Play className="w-6 h-6 ml-1 text-[#ff0000]" fill="currentColor" /> : IconComponent}
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Image Display & Book Cover */}
            {image && type !== 'map' && type !== 'media' && type !== 'youtube' && (
                <img
                    src={image}
                    alt={title}
                    className={`w-full object-cover rounded-2xl mb-6 mt-4 shadow-sm ${type === 'book' ? 'aspect-[2/3] max-w-[200px] shadow-2xl' : 'h-48'}`}
                    style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }}
                />
            )}
            {renderIllustration()}

            {date && type !== 'map' && type !== 'twitter' && <p className="text-xs font-bold mb-4 opacity-60 tracking-wider">{date}</p>}
            {date && type === 'twitter' && <p className="text-xs font-bold mb-4 opacity-50 tracking-wider w-full text-left mt-4">{date}</p>}

            {description && type !== 'twitter' && (
                <p className={`text-sm md:text-[15px] leading-relaxed opacity-80 ${type === 'profile' ? 'max-w-[250px]' : ''}`}>
                    {description}
                </p>
            )}

            {type === 'map' && (
                <div className="mt-4">
                    <h3 className="text-2xl font-serif mb-1">{date}</h3>
                    <p className="text-lg opacity-80">{time}</p>
                </div>
            )}

            <div className={`mt-auto pt-6 flex gap-3 ${type === 'twitter' ? 'w-full justify-start' : ''}`}>
                {buttonText && type === 'document' && data.fileUrl ? (
                    <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-8 px-6 py-2.5 rounded-full border border-current text-xs font-bold tracking-wider uppercase hover:opacity-70 transition-opacity">
                        {buttonText}
                    </a>
                ) : buttonText && (
                    <CardButton text={buttonText} textColor={textColor} />
                )}
                {type === 'profile' && buttonText === 'LINKEDIN' && (
                    <CardButton icon={<X className="w-4 h-4" />} textColor={textColor} />
                )}
            </div>
        </div>
    );
};

// --- Magazine Layout Card Variants ---

export const LeadCard = ({ data, onClick }) => (
    <div
        className="relative rounded-[2rem] overflow-hidden cursor-pointer group bg-[#f6f4f1]"
        onClick={() => onClick(data)}
    >
        {data.image && (
            <div className="w-full aspect-[16/10] overflow-hidden">
                <img
                    src={data.image}
                    alt={data.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }}
                />
            </div>
        )}
        <div className="p-6 md:p-8">
            {data.tag && (
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#E03E2D] mb-2 block">
                    {data.tag}
                </span>
            )}
            <h2 className="font-serif text-2xl md:text-3xl leading-tight mb-3 text-[#0A0A0A]">
                {data.title}
            </h2>
            {data.summary && (
                <p className="text-sm text-[#666] leading-relaxed line-clamp-3">{data.summary}</p>
            )}
        </div>
    </div>
);

export const SideCard = ({ data, onClick }) => (
    <div
        className="flex gap-4 items-start cursor-pointer group py-2"
        onClick={() => onClick(data)}
    >
        <div className="flex-1 min-w-0">
            {data.tag && (
                <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#E03E2D] mb-1 block">
                    {data.tag}
                </span>
            )}
            <h3 className="font-serif text-lg leading-snug text-[#0A0A0A] group-hover:text-[#E03E2D] transition-colors mb-1 line-clamp-3">
                {data.title}
            </h3>
            {data.summary && (
                <p className="text-xs text-[#888] line-clamp-2 leading-relaxed">{data.summary}</p>
            )}
        </div>
        {data.image && (
            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                <img
                    src={data.image}
                    alt={data.title}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }}
                />
            </div>
        )}
    </div>
);

export const MagazineCard = ({ data, onClick }) => (
    <div
        className="cursor-pointer group"
        onClick={() => onClick(data)}
    >
        {data.image && (
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3">
                <img
                    src={data.image}
                    alt={data.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }}
                />
            </div>
        )}
        {data.tag && (
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#E03E2D] mb-1 block">
                {data.tag}
            </span>
        )}
        <h3 className="font-serif text-base leading-snug text-[#0A0A0A] group-hover:text-[#E03E2D] transition-colors line-clamp-3">
            {data.title}
        </h3>
    </div>
);

export const GridCard = ({ data, onClick }) => (
    <div
        className="cursor-pointer group"
        onClick={() => onClick(data)}
    >
        {data.image && (
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-3">
                <img
                    src={data.image}
                    alt={data.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: `${data.imageFocalX ?? 50}% ${data.imageFocalY ?? 50}%` }}
                />
            </div>
        )}
        {data.tag && (
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#E03E2D] mb-1 block">
                {data.tag}
            </span>
        )}
        <h3 className="font-serif text-sm leading-snug text-[#0A0A0A] group-hover:text-[#E03E2D] transition-colors line-clamp-2">
            {data.title}
        </h3>
    </div>
);
