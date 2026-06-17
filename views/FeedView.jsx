"use client";

import React, { useMemo } from 'react';
import { Newspaper } from 'lucide-react';
import { useMain } from '@/lib/MainContext';
import {
  LeadStory,
  SecondaryCard,
  RiverRow,
  HeadlineRow,
  SectionHeader,
} from '@/components/NewsRiver';

// ─── Loading skeleton — mirrors the lead + river layout ──────────────────────
const FeedSkeleton = () => (
  <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-6 md:pt-9 animate-pulse">
    <div className="grid md:grid-cols-2 gap-6 md:gap-9 pb-8 border-b border-line">
      <div className="w-full aspect-[16/10] md:aspect-[5/4] bg-surface rounded-xl" />
      <div className="flex flex-col justify-center">
        <div className="h-3 w-20 bg-surface rounded mb-4" />
        <div className="h-8 w-full bg-surface rounded mb-2" />
        <div className="h-8 w-4/5 bg-surface rounded mb-5" />
        <div className="h-3 w-full bg-surface rounded mb-2" />
        <div className="h-3 w-2/3 bg-surface rounded" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 py-8">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div className="w-full aspect-[16/10] bg-surface rounded-lg mb-3.5" />
          <div className="h-5 w-full bg-surface rounded mb-2" />
          <div className="h-5 w-3/5 bg-surface rounded" />
        </div>
      ))}
    </div>
  </div>
);

const EmptyState = ({ category, onClear }) => (
  <div className="max-w-[1240px] mx-auto px-6 py-28 text-center">
    <Newspaper className="mx-auto mb-5 text-faint" size={40} strokeWidth={1.5} />
    <h1 className="font-serif text-3xl text-ink mb-3">
      {category ? `Inget i ${category} än` : 'Inget publicerat än'}
    </h1>
    <p className="text-muted font-sans max-w-sm mx-auto leading-relaxed">
      {category
        ? 'Det finns inga artiklar i den här kategorin just nu.'
        : 'Nya artiklar dyker upp här så fort de är publicerade.'}
    </p>
    {category && (
      <button
        onClick={onClear}
        className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Visa senaste
      </button>
    )}
  </div>
);

// ─── News-river feed ─────────────────────────────────────────────────────────
const FeedView = ({ articles, setActiveArticle, loading }) => {
  const { category, setCategory } = useMain();

  const sorted = useMemo(
    () => [...(articles || [])].sort((a, b) => b.date - a.date),
    [articles]
  );

  const filtered = useMemo(
    () => (category ? sorted.filter((a) => (a.tag || a.category) === category) : sorted),
    [sorted, category]
  );

  // Topics sidebar — every category with a count, most populous first.
  const topics = useMemo(() => {
    const m = new Map();
    for (const a of sorted) {
      const c = a.tag || a.category;
      if (c) m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [sorted]);

  if (loading) return <FeedSkeleton />;
  if (filtered.length === 0) return <EmptyState category={category} onClear={() => setCategory(null)} />;

  const [lead, ...rest] = filtered;
  const secondary = rest.slice(0, 3);
  const river = rest.slice(3);
  const latest = sorted.slice(0, 6);

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-5 md:pt-8 animate-in fade-in duration-500">
      {category && <SectionHeader title={category} className="mb-5" />}

      {/* Lead */}
      <div className="pb-8 border-b border-line">
        <LeadStory article={lead} onOpen={setActiveArticle} />
      </div>

      {/* Secondary 3-up */}
      {secondary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 py-8 border-b border-line">
          {secondary.map((a) => (
            <SecondaryCard key={a.id} article={a} onOpen={setActiveArticle} />
          ))}
        </div>
      )}

      {/* River + sidebar */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-8 lg:gap-14 pt-8 pb-16">
        <div className="min-w-0">
          <SectionHeader title={category ? `Mer i ${category}` : 'Senaste nytt'} />
          {river.length > 0 ? (
            <div className="flex flex-col">
              {river.map((a) => (
                <RiverRow key={a.id} article={a} onOpen={setActiveArticle} />
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm py-6">Inga fler artiklar här just nu.</p>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[72px] flex flex-col gap-9">
            <div>
              <SectionHeader title="Rubriker" />
              <div className="flex flex-col">
                {latest.map((a, i) => (
                  <HeadlineRow key={a.id} article={a} onOpen={setActiveArticle} index={i} />
                ))}
              </div>
            </div>

            {topics.length > 0 && (
              <div>
                <SectionHeader title="Ämnen" />
                <div className="flex flex-wrap gap-2 pt-1">
                  {topics.map(([c, n]) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                        category === c
                          ? 'bg-accent border-accent text-accent-ink'
                          : 'bg-card border-line text-dek hover:border-line-strong hover:text-ink'
                      }`}
                    >
                      {c}
                      <span className={category === c ? 'text-accent-ink/70' : 'text-faint'}>{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FeedView;
