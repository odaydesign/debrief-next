"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useQuery, api } from '@/lib/db';
import { useMain } from '@/lib/MainContext';
import ThemeToggle from './ThemeToggle';
import AccountButton from './AccountButton';

/**
 * Sticky masthead nav: serif wordmark + category sections + search + controls.
 * Categories are data-driven (the article tags) and select the news-river
 * category in MainContext, navigating home if needed.
 */
const catCls = (active) =>
  `px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
    active ? 'text-accent' : 'text-muted hover:text-ink'
  }`;

const CategoryRow = ({ cats, category, onPick, className }) => (
  <nav className={`flex items-center gap-0.5 overflow-x-auto no-scrollbar ${className || ''}`}>
    <button onClick={() => onPick(null)} className={catCls(category === null)}>Senaste</button>
    {cats.map((c) => (
      <button key={c} onClick={() => onPick(c)} className={catCls(category === c)}>{c}</button>
    ))}
  </nav>
);

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { category, setCategory } = useMain();
  const tags = useQuery(api.articles.getAllTags) || [];
  const cats = tags.slice(0, 7);

  const pick = (c) => {
    setCategory(c);
    if (pathname !== '/') router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-line">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6">
        <div className="h-14 flex items-center gap-3">
          <Link
            href="/"
            onClick={() => setCategory(null)}
            className="font-serif text-[1.65rem] font-semibold tracking-tight leading-none shrink-0 hover:text-accent transition-colors"
          >
            Debrief
          </Link>

          <span className="hidden md:block w-px h-6 bg-line mx-1.5 shrink-0" />
          <CategoryRow cats={cats} category={category} onPick={pick} className="hidden md:flex flex-1 min-w-0" />

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <Link
              href="/search"
              aria-label="Sök"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface transition-colors active:scale-90"
            >
              <Search size={18} strokeWidth={2} />
            </Link>
            <ThemeToggle inline />
            <AccountButton inline />
          </div>
        </div>

        {/* Mobile category row */}
        <CategoryRow cats={cats} category={category} onPick={pick} className="md:hidden pb-2" />
      </div>
    </header>
  );
}
