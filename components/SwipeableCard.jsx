"use client";

import React, { memo, useCallback, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import DateBadge from './DateBadge';
import { Bookmark, Check } from 'lucide-react';

const SwipeableCard = memo(({ article, onExpand, onBookmark, layoutId }) => {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // Only allow slightly swiping to the right for bookmarking
    // We don't want 360 rotation or throwing away anymore.
    const rotate = useTransform(x, [0, 150], [0, 5]);
    const opacity = useTransform(x, [0, 150], [1, 0.9]);

    // Reveal the bookmark background/icon behind the card
    const iconScale = useTransform(x, [0, 80], [0.5, 1.2]);
    const iconOpacity = useTransform(x, [0, 50], [0, 1]);

    const handleDragEnd = useCallback(async (event, info) => {
        const offset = info.offset.x;
        const width = 100; // Threshold

        if (offset > width) {
            // Success! Bookmark triggered
            if (navigator?.vibrate) navigator.vibrate(50);

            // Trigger feedback logic
            setShowSuccess(true);
            onBookmark(article.id);

            // Temporarily hold then snap back
            await new Promise(r => setTimeout(r, 500));
            setShowSuccess(false);
        }

        // Always snap back
        controls.start({ x: 0, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }, [controls, onBookmark, article.id]);

    return (
        <div className="relative w-full aspect-[3/4] mb-8 perspective-1000 group">

            {/* Background Layer (Bookmark Action) */}
            <div className="absolute inset-0 bg-emerald-500 rounded-3xl flex items-center justify-start pl-8 z-0">
                <motion.div style={{ scale: iconScale, opacity: iconOpacity }}>
                    <Bookmark className="text-white w-12 h-12 fill-current" />
                </motion.div>
            </div>

            {/* Notification Toast (Ephemeral) */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-xl"
                    >
                        <Check size={16} className="text-emerald-400" />
                        Sparad
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Main Card */}
            <motion.div
                layoutId={layoutId}
                drag="x"
                dragConstraints={{ left: 0, right: 150 }} // Only drag right slightly
                dragElastic={0.2} // Stiff resistance
                dragSnapToOrigin={true}
                onDragStart={() => navigator?.vibrate?.(10)}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x, rotate, opacity, touchAction: "pan-y" }}
                className="relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/5 cursor-grab active:cursor-grabbing z-10"
                onClick={(e) => {
                    // Prevent click if dragging
                    if (Math.abs(x.get()) < 5) onExpand();
                }}
            >
                {/* Bookmarked Indicator (Permanent) */}
                {article.isBookmarked && (
                    <div className="absolute top-4 right-4 z-40 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                        <Bookmark size={16} fill="currentColor" />
                    </div>
                )}

                {/* Content */}
                <div className="absolute inset-0">
                    <motion.img
                        layoutId={`article-image-${article.id}`}
                        src={article.image}
                        alt=""
                        className="w-full h-[65%] object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />
                </div>

                <div className="absolute bottom-0 inset-x-0 h-[35%] bg-white p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">
                                {article.category}
                            </span>
                            <DateBadge date={article.date} />
                        </div>
                        <motion.h2
                            layoutId={`article-title-${article.id}`}
                            className="text-2xl font-bold text-gray-900 leading-tight tracking-tight line-clamp-2 mb-2"
                        >
                            {article.title}
                        </motion.h2>
                        <motion.p
                            layoutId={`article-summary-${article.id}`}
                            className="text-gray-500 text-sm leading-relaxed line-clamp-2"
                        >
                            {article.summary}
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

SwipeableCard.displayName = 'SwipeableCard';

export default SwipeableCard;
