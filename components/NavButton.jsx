"use client";

import React from 'react';

const NavButton = ({ icon: Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-2xl transition-all duration-300 relative group ${active ? 'text-black bg-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'
            }`}
    >
        <Icon size={24} strokeWidth={active ? 2.5 : 2} />
        {active && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"></span>
        )}
    </button>
);

export default NavButton;
