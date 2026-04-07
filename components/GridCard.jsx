"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Bookmark } from 'lucide-react';

const GridCard = ({ article, onBookmark, onClick }) => {
    const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked || false);
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Transform values for swipe-to-bookmark feedback
    const xInput = [-150, 0, 150];
    const background = useTransform(x, xInput, [
        "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)", // Green for bookmark
        "linear-gradient(90deg, #f5f5f4 0%, #f5f5f4 100%)", // Default stone-50
        "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)"  // Green for bookmark
    ]);
    const iconScale = useTransform(x, [-100, 0, 100], [1.5, 0.5, 1.5]);
    const iconOpacity = useTransform(x, [-50, 0, 50], [1, 0, 1]);

    const handleDragEnd = async (e, { offset, velocity }) => {
        const swipeThreshold = 50;

        if (Math.abs(offset.x) > swipeThreshold) {
            // Trigger bookmark
            const newState = !isBookmarked;
            setIsBookmarked(newState);
            onBookmark(article.id);
            if (navigator?.vibrate) navigator.vibrate(20);

            // Snap back
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        } else {
            // Didn't swipe far enough, snap back
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }
    };

    return (
        <div className="relative w-full mb-6 rounded-2xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200/50">
            {/* Background hint for swiping */}
            <motion.div
                className="absolute inset-0 flex items-center justify-between px-8"
                style={{ background }}
            >
                <motion.div style={{ scale: iconScale, opacity: iconOpacity }}>
                    <Bookmark size={24} className="text-white" />
                </motion.div>
                <motion.div style={{ scale: iconScale, opacity: iconOpacity }}>
                    <Bookmark size={24} className="text-white" />
                </motion.div>
            </motion.div>

            {/* Draggable Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                style={{ x }}
                animate={controls}
                whileTap={{ scale: 0.98 }}
                onClick={() => onClick(article)}
                className="relative bg-white w-full h-[450px] flex flex-col cursor-pointer origin-center"
            >
                <div className="h-[50%] relative overflow-hidden">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full">
                        <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">
                            {article.category}
                        </span>
                    </div>
                    {isBookmarked && (
                        <div className="absolute top-4 right-4 bg-green-500 p-2 rounded-full shadow-lg">
                            <Bookmark size={14} className="fill-white text-white" />
                        </div>
                    )}
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-serif text-stone-900 leading-tight mb-3 line-clamp-2">
                            {article.title}
                        </h2>
                        <p className="text-stone-500 font-sans text-sm line-clamp-3 leading-relaxed">
                            {article.summary}
                        </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pb-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest border border-stone-200 rounded-full px-3 py-1">
                            {article.readTime}
                        </span>
                        <span className="text-xs font-bold text-stone-400">By {article.author}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GridCard;
