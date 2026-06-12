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
      className="fixed left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-card/90 backdrop-blur-xl border border-line rounded-2xl shadow-2xl z-[60] flex justify-between items-center p-1.5 px-4 pointer-events-auto"
      style={{ bottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))" }}
    >
      {navItems.map(({ icon: Icon, href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`p-4 rounded-2xl transition-all duration-300 relative group ${
              active
                ? 'text-accent'
                : 'text-muted hover:text-ink'
            }`}
            aria-label={label}
          >
            <Icon size={23} strokeWidth={active ? 2.5 : 2} />
            {active && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
