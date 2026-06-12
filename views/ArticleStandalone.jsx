"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, api } from '@/lib/db';
import { useMain, formatArticles } from '@/lib/MainContext';
import ArticleBody from '@/components/ArticleBody';
import ArticleNotes from '@/components/ArticleNotes';
import ShareButton from '@/components/ShareButton';

// Standalone reading surface for deep links (/a/[id]). The in-app reading
// experience stays in the overlay; this page serves shared/cold visits with
// the same body renderer.
const ArticleStandalone = ({ id }) => {
    const { user, interactions, markArticleRead } = useMain();
    const raw = useQuery(api.articles.getById, { id });
    const card = raw ? formatArticles([raw], interactions)[0] : raw;

    // Deep-linked reads count toward the daily ritual too.
    const marked = useRef(false);
    useEffect(() => {
        if (!marked.current && user && raw?.id) {
            marked.current = true;
            markArticleRead(raw.id);
        }
    }, [user, raw?.id, markArticleRead]);

    if (raw === undefined) {
        return (
            <div className="max-w-[680px] mx-auto px-5 md:px-8 pt-14 pb-32 animate-pulse">
                <div className="h-3 w-20 bg-surface rounded mb-8" />
                <div className="h-9 w-full bg-surface rounded mb-2" />
                <div className="h-9 w-3/4 bg-surface rounded mb-8" />
                <div className="w-full aspect-video bg-surface rounded-2xl mb-8" />
                <div className="h-3 w-full bg-surface rounded mb-2" />
                <div className="h-3 w-[92%] bg-surface rounded mb-2" />
                <div className="h-3 w-4/5 bg-surface rounded" />
            </div>
        );
    }

    if (raw === null) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
                <span className="font-serif text-base font-semibold tracking-tight mb-8">Debrief</span>
                <h1 className="font-serif text-3xl text-ink mb-3">Artikeln finns inte längre</h1>
                <p className="text-muted font-sans max-w-sm leading-relaxed mb-8">
                    Den kan ha tagits bort ur arkivet — men dagens nummer väntar.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition-opacity">
                    Läs dagens utgåva →
                </Link>
            </div>
        );
    }

    const tag = card.tag || card.category;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[680px] mx-auto px-5 md:px-8 pt-14 pb-32"
        >
            {/* topline: wordmark home + chip + share */}
            <div className="flex items-center justify-between mb-9">
                <Link href="/" className="font-serif text-base font-semibold tracking-tight hover:text-accent transition-colors">
                    Debrief
                </Link>
                <div className="flex items-center gap-3">
                    {tag && <span className="chip"><span className="chip-dot" />{tag}</span>}
                    <ShareButton article={card} variant="icon" />
                </div>
            </div>

            <ArticleBody card={card} />

            <ArticleNotes articleId={id} />

            {/* footer CTA */}
            <div className="mt-12 pt-7 border-t border-line text-center">
                <p className="meta text-faint tracking-[0.25em] mb-5">— SLUT —</p>
                <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink text-sm font-semibold hover:opacity-90 transition-opacity">
                    Läs dagens utgåva →
                </Link>
            </div>
        </motion.div>
    );
};

export default ArticleStandalone;
