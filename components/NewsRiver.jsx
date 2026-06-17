"use client";

import React from 'react';

/**
 * News-river building blocks — a professional tech-news layout (lead story,
 * secondary cards, "latest" rows). Serif headlines, sans support text, hairline
 * dividers; images are clean and borderless. Shared look, three densities.
 */

// Swedish relative time: "just nu", "12 min sedan", "3 tim sedan", "i går",
// "3 dgr sedan", then falls back to a short date.
export const relativeTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'just nu';
  if (min < 60) return `${min} min sedan`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} tim sedan`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'i går';
  if (days < 7) return `${days} dgr sedan`;
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
};

const catOf = (a) => a.tag || a.category;
const dekOf = (a) => a.description || a.summary;

// Make a non-anchor element behave like an activatable link (keyboard + click).
const openProps = (onOpen, article) => ({
  onClick: () => onOpen(article),
  onKeyDown: (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(article); }
  },
  role: 'link',
  tabIndex: 0,
});

const Img = ({ article, className }) => (
  <div className={`overflow-hidden bg-surface ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={article.image}
      alt={article.title}
      loading="lazy"
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      style={{ objectPosition: `${article.imageFocalX ?? 50}% ${article.imageFocalY ?? 50}%` }}
    />
  </div>
);

const Kicker = ({ article }) => {
  const c = catOf(article);
  return c ? <span className="kicker">{c}</span> : null;
};

const Byline = ({ article, className = '' }) => (
  <p className={`text-[12.5px] text-muted ${className}`}>
    {[article.author, relativeTime(article.date)].filter(Boolean).join(' · ')}
  </p>
);

// ── Lead story — image + headline side by side on desktop, stacked on mobile ──
export const LeadStory = ({ article, onOpen }) => (
  <article {...openProps(onOpen, article)} className="group cursor-pointer grid md:grid-cols-2 gap-5 md:gap-9 md:items-center">
    {article.image && <Img article={article} className="w-full aspect-[16/10] md:aspect-[5/4] rounded-xl" />}
    <div>
      <Kicker article={article} />
      <h2 className="font-serif text-[2rem] md:text-[2.7rem] leading-[1.04] tracking-[-0.02em] text-balance mt-2.5 mb-3 group-hover:text-accent transition-colors">
        {article.title}
      </h2>
      {dekOf(article) && (
        <p className="text-[15px] md:text-[16.5px] text-dek leading-relaxed line-clamp-3 mb-3.5">{dekOf(article)}</p>
      )}
      <Byline article={article} />
    </div>
  </article>
);

// ── Secondary card — image on top, used in the 3-up row under the lead ──
export const SecondaryCard = ({ article, onOpen }) => (
  <article {...openProps(onOpen, article)} className="group cursor-pointer flex flex-col">
    {article.image && <Img article={article} className="w-full aspect-[16/10] rounded-lg mb-3.5" />}
    <Kicker article={article} />
    <h3 className="font-serif text-[1.3rem] leading-[1.12] tracking-tight text-balance mt-1.5 mb-2 group-hover:text-accent transition-colors">
      {article.title}
    </h3>
    <Byline article={article} className="mt-auto pt-1" />
  </article>
);

// ── River row — the classic "Latest" item: text left, thumbnail right ──
export const RiverRow = ({ article, onOpen }) => (
  <article {...openProps(onOpen, article)} className="group cursor-pointer flex gap-4 md:gap-6 py-5 border-b border-line">
    <div className="flex-1 min-w-0">
      <Kicker article={article} />
      <h3 className="font-serif text-[1.2rem] md:text-[1.35rem] leading-[1.13] tracking-tight text-balance mt-1.5 mb-1.5 group-hover:text-accent transition-colors">
        {article.title}
      </h3>
      {dekOf(article) && (
        <p className="hidden md:block text-sm text-dek leading-relaxed line-clamp-2 mb-2">{dekOf(article)}</p>
      )}
      <Byline article={article} />
    </div>
    {article.image && <Img article={article} className="shrink-0 w-[108px] h-[80px] md:w-[160px] md:h-[106px] rounded-lg" />}
  </article>
);

// ── Compact headline — for the desktop sidebar list ──
export const HeadlineRow = ({ article, onOpen, index }) => (
  <article {...openProps(onOpen, article)} className="group cursor-pointer flex gap-3 py-3.5 border-b border-line last:border-0">
    {typeof index === 'number' && (
      <span className="font-serif text-[1.4rem] leading-none text-line-strong shrink-0 w-6">{index + 1}</span>
    )}
    <div className="min-w-0">
      <h4 className="font-serif text-[1.02rem] leading-[1.18] tracking-tight text-balance group-hover:text-accent transition-colors">
        {article.title}
      </h4>
      <p className="text-[11.5px] text-muted mt-1">{relativeTime(article.date)}</p>
    </div>
  </article>
);

// ── Section label with a trailing rule ──
export const SectionHeader = ({ title, className = '' }) => (
  <div className={`flex items-center gap-3 mb-2 ${className}`}>
    <h2 className="font-sans text-[13px] font-bold uppercase tracking-[0.14em] text-ink whitespace-nowrap">{title}</h2>
    <span className="h-px flex-1 bg-line" />
  </div>
);
