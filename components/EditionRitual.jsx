"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ShareButton from '@/components/ShareButton';
import { localDateKey } from '@/lib/streak';

/**
 * The daily ritual: progress through today's edition, and the "Du är ikapp"
 * moment when it's finished.
 */

// "3 av 7 lästa" + a thin accent progress track. Lives in the masthead meta row.
export const EditionProgress = ({ read, total }) => {
    if (!total) return null;
    const p = Math.min(1, read / total);
    return (
        <span className="inline-flex items-center gap-2.5">
            <span className="meta">{read} av {total} lästa</span>
            <span className="w-12 h-[2px] rounded-full bg-line overflow-hidden inline-block">
                <motion.span
                    className="block h-full bg-accent origin-left"
                    initial={false}
                    animate={{ scaleX: p }}
                    transition={{ type: 'spring', stiffness: 160, damping: 26 }}
                />
            </span>
        </span>
    );
};

// Animated check that draws itself when completion happens live.
const DrawnCheck = ({ animate }) => (
    <span className="w-14 h-14 rounded-full border border-accent flex items-center justify-center" style={{ color: 'var(--accent)' }}>
        <motion.svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <motion.path
                d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: animate ? 0.25 : 0 }}
            />
        </motion.svg>
    </span>
);

// Editorial completion card shown after today's list once every brief is read.
export const EditionCompleteCard = ({ streak = 0 }) => {
    // Animate only in the session where completion actually happened —
    // remounts on later visits render the card statically.
    const [animate] = useState(() => {
        if (typeof window === 'undefined') return false;
        const key = `debrief-celebrated-${localDateKey(new Date())}`;
        try {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, '1');
                return true;
            }
        } catch { /* ignore */ }
        return false;
    });

    return (
        <motion.div
            initial={animate ? { opacity: 0, y: 28, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, delay: animate ? 0.1 : 0 }}
            className="w-full max-w-[640px] mx-auto px-4 mt-2"
        >
            <div className="bg-card border border-line rounded-2xl p-7 md:p-9 text-center flex flex-col items-center">
                <DrawnCheck animate={animate} />
                <h2 className="font-serif font-semibold text-[1.8rem] md:text-[2.1rem] tracking-tight leading-tight mt-5">
                    Du är ikapp.
                </h2>
                <p className="text-dek text-[15px] leading-relaxed mt-1.5">Vi ses imorgon.</p>
                {streak >= 2 && (
                    <p className="kicker mt-5">{streak} dagar i rad</p>
                )}
                <div className="mt-6">
                    <ShareButton variant="button" label="Dela Debrief" />
                </div>
            </div>
        </motion.div>
    );
};
