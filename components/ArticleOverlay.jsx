"use client";

import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Tweet } from 'react-tweet';

const ArticleOverlay = ({ card, isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!card) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-end justify-center ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>

            {/* Dimmed Backdrop */}
            <div
                className={`absolute inset-0 bg-[#2a2726]/80 backdrop-blur-md transition-opacity duration-[800ms] ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Sliding Article Panel */}
            <div
                className={`relative w-full max-w-[900px] h-[92vh] bg-[#f6f4f1] text-[#2a2726] rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Sticky Header with Close Button */}
                <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-[#f6f4f1] to-transparent transition-opacity duration-[800ms] delay-150 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-sm text-stone-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Article Content */}
                <div className={`flex-1 overflow-y-auto px-6 md:px-16 pt-24 pb-32 custom-scrollbar transition-all duration-[800ms] delay-[150ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

                    {card.tag && (
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-8 inline-block ${card.tagStyle || 'bg-[#50c878] text-white'}`}>
                            {card.tag}
                        </span>
                    )}

                    <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
                        {card.title}
                    </h1>

                    {card.date && <p className="text-sm font-bold opacity-50 tracking-wider mb-8">{card.date instanceof Date ? card.date.toLocaleDateString('sv-SE') : card.date}</p>}

                    {card.type === 'twitter' && card.externalId && (
                        <div data-theme="light" className="w-full flex justify-center mb-8">
                            <Tweet id={card.externalId} />
                        </div>
                    )}

                    {card.type === 'youtube' && card.externalId && (
                        <div className="w-full aspect-video rounded-[2rem] overflow-hidden mb-12 shadow-lg bg-black">
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
                        <div className="w-full aspect-video rounded-[2rem] overflow-hidden mb-12 shadow-lg">
                            <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="prose prose-lg prose-zinc max-w-none text-[#2a2726] font-sans">
                        <p className="text-xl md:text-2xl leading-relaxed opacity-90 mb-8 font-serif">
                            {card.description || card.summary}
                        </p>

                        <div className="text-base md:text-lg opacity-80 space-y-6 leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: card.fullText || card.content || "" }} />
                            {(!card.fullText && !card.content) && (
                                <>
                                    <p>
                                        I en era som definieras av snabba tekniska förändringar är förmågan att anpassa sig och förutse grundläggande skiften avgörande. Denna utveckling markerar en betydande milstolpe i det bredare landskapet och sätter nya riktmärken för innovation och operationell skala.
                                    </p>
                                    <p>
                                        Analytiker tror att detta drag kommer att utlösa en kaskad av liknande strategier över hela branschen. "Vi bevittnar mognaden av koncept som var rent teoretiska för bara fem år sedan," noterade en ledande forskare. "Ekosystemet är äntligen tillräckligt robust för att stödja denna nivå av ambition utan att kompromissa med stabiliteten."
                                    </p>
                                    <p>
                                        Framöver planerar teamet att utöka sitt operationella fotavtryck avsevärt under de kommande 18 månaderna. Med resurserna nu säkrade skiftar fokus helt från att bevisa konceptet till att skala utförandet globalt.
                                    </p>
                                </>
                            )}

                            {card.sourceLink && (
                                <div className="mt-12 pt-8 border-t border-[#2a2726]/10">
                                    <a
                                        href={card.sourceLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#50c878] hover:text-[#2a2726] transition-colors"
                                    >
                                        {card.sourceText || 'Till Källan'}
                                        <ArrowLeft className="w-4 h-4 rotate-135" style={{ transform: 'rotate(135deg)' }} />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleOverlay;
