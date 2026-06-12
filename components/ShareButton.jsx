"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * Share an article (or the app itself) — native share sheet on mobile,
 * copy-link with a "Länk kopierad" confirmation elsewhere.
 *
 * variant: 'icon'   → 36px round button (reader topline)
 *          'button' → labelled pill ("Dela", reader end-footer)
 */
const ShareButton = ({ article, variant = 'icon', label = 'Dela' }) => {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const share = async (e) => {
        e?.stopPropagation?.();
        const id = article?.id || article?._id;
        const url = id ? `${window.location.origin}/a/${id}` : window.location.origin;
        const payload = {
            title: article?.title || 'Debrief',
            text: article?.description || article?.summary || 'Din dagliga nyhetsbrief.',
            url,
        };
        if (navigator.share) {
            try { await navigator.share(payload); } catch { /* user dismissed */ }
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const confirmation = copied && (
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card border border-line rounded-full px-3 py-1.5 shadow-lg meta flex items-center gap-1.5 z-10" style={{ color: 'var(--ink)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
            Länk kopierad
        </span>
    );

    if (variant === 'button') {
        return (
            <span className="relative inline-flex">
                {confirmation}
                <button
                    onClick={share}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line text-ink text-sm font-medium hover:bg-surface transition-colors active:scale-95"
                >
                    {copied ? <Check size={15} className="text-accent" /> : <Share2 size={15} />}
                    {label}
                </button>
            </span>
        );
    }

    return (
        <span className="relative inline-flex">
            {confirmation}
            <button
                onClick={share}
                aria-label="Dela artikeln"
                className="w-9 h-9 rounded-full border border-line bg-card text-ink flex items-center justify-center hover:bg-surface transition-colors active:scale-90"
            >
                {copied ? <Check size={15} className="text-accent" /> : <Share2 size={15} />}
            </button>
        </span>
    );
};

export default ShareButton;
