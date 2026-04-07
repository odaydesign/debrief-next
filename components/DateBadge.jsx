"use client";

import React from 'react';

const DateBadge = ({ date }) => (
    <div className="flex flex-col items-center bg-white/80 backdrop-blur-md rounded-xl p-2 min-w-[3.5rem] shadow-sm border border-black/5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {date.toLocaleString('sv-SE', { month: 'short' })}
        </span>
        <span className="text-xl font-bold text-gray-900 leading-none mt-0.5">
            {date.getDate()}
        </span>
    </div>
);

export default DateBadge;
