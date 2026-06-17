"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Calendar, Search, Bookmark, StickyNote } from 'lucide-react';

const navItems = [
  { icon: Layers, href: '/', label: 'Flöde' },
  { icon: Calendar, href: '/archive', label: 'Arkiv' },
  { icon: Search, href: '/search', label: 'Sök' },
  { icon: Bookmark, href: '/bookmarks', label: 'Sparat' },
  { icon: StickyNote, href: '/notes', label: 'Anteckningar' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-card/90 backdrop-blur-xl border border-line rounded-2xl shadow-2xl z-[60] flex justify-between items-center p-1.5 px-4 pointer-events-auto"
      style={{ bottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))" }}
    >
      {navItems.map(({ icon: Icon, href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-2.5 py-2.5 rounded-2xl transition-all duration-300 ${
              active
                ? 'text-accent'
                : 'text-muted hover:text-ink'
            }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={21} strokeWidth={active ? 2.5 : 2} />
            <span className={`font-mono text-[8.5px] uppercase tracking-[0.08em] leading-none ${active ? 'font-semibold' : ''}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
