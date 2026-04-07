"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';

const DeckCard = memo(({ article, stackDepth, onClick }) => {
  // Calculate visual stack position
  const scale = 1 - (stackDepth * 0.05);
  const yOffset = stackDepth * 25;
  const opacity = Math.max(0.4, 1 - (stackDepth * 0.15));
  const zIndex = 50 - stackDepth;
  const isFront = stackDepth === 0;

  return (
    <motion.div
      onClick={() => isFront && onClick()}
      initial={{ scale: 0.8, y: 50, opacity: 0 }}
      animate={{
        scale: scale,
        y: yOffset,
        opacity: opacity
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        delay: stackDepth * 0.05
      }}
      className={`absolute top-0 left-0 w-full h-[70vh] max-h-[600px] bg-cream rounded-[24px] overflow-hidden shadow-2xl ${isFront ? 'cursor-pointer' : 'pointer-events-none'}`}
      style={{ zIndex }}
    >
      <div className="relative h-[60%] overflow-hidden">
        <motion.img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
        <div className="absolute top-6 left-6">
          <span className="inline-block bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-stone-900 uppercase tracking-widest">
            {article.category}
          </span>
        </div>
      </div>

      <div className="h-[40%] bg-cream p-8 flex flex-col justify-center">
        <h2 className="text-3xl font-serif text-stone-900 leading-[1.1] mb-3 line-clamp-2">
          {article.title}
        </h2>
        <p className="text-stone-600 text-sm font-sans leading-relaxed line-clamp-3">
          {article.summary}
        </p>
      </div>
    </motion.div>
  );
});

export default DeckCard;
