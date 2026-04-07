"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Calendar, Search, Bookmark, Plus } from 'lucide-react';

const navItems = [
  { icon: Layers, href: '/', label: 'Feed' },
  { icon: Calendar, href: '/archive', label: 'Archive' },
  { icon: Search, href: '/search', label: 'Search' },
  { icon: Bookmark, href: '/bookmarks', label: 'Bookmarks' },
  { icon: Plus, href: '/notes', label: 'Notes' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[60] flex justify-between items-center p-1.5 px-4 pointer-events-auto">
      {navItems.map(({ icon: Icon, href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`p-4 rounded-2xl transition-all duration-300 relative group ${
              active
                ? 'text-black bg-black/5'
                : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'
            }`}
            aria-label={label}
          >
            <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            {active && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
