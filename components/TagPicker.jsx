"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, api } from "@/lib/db";
import { Tag, Plus, X } from 'lucide-react';

const TagPicker = ({ value, onChange }) => {
    const allTags = useQuery(api.articles.getAllTags) || [];
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredTags = allTags.filter(t =>
        t.toLowerCase().includes(inputValue.toLowerCase()) && t !== value
    );

    const selectTag = (tag) => {
        onChange(tag);
        setInputValue('');
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setIsOpen(true);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                selectTag(inputValue.trim().toUpperCase());
            }
        }
    };

    const clearTag = () => {
        onChange('');
        setInputValue('');
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Selected tag display */}
            {value ? (
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#50c878]/15 text-[#50c878] px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">
                        <Tag size={11} />
                        {value}
                        <button onClick={clearTag} className="ml-1 hover:text-white transition-colors">
                            <X size={12} />
                        </button>
                    </span>
                </div>
            ) : null}

            {/* Input */}
            <div className="flex items-center gap-2">
                <Tag size={14} className="text-white/20" />
                <input
                    type="text"
                    value={value ? '' : inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={value ? 'Byt tag...' : 'Lägg till tag (t.ex. AI, DESIGN)'}
                    disabled={!!value}
                    className="bg-transparent text-sm text-[#50c878] placeholder-white/20 focus:outline-none flex-1 font-bold tracking-wider uppercase disabled:opacity-30 disabled:cursor-default"
                />
            </div>

            {/* Dropdown */}
            {isOpen && !value && (filteredTags.length > 0 || inputValue.trim()) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1818] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {/* Existing tags */}
                    {filteredTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => selectTag(tag)}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <Tag size={12} className="text-[#50c878]/50" />
                            {tag}
                        </button>
                    ))}

                    {/* Create new tag option */}
                    {inputValue.trim() && !allTags.includes(inputValue.trim().toUpperCase()) && (
                        <button
                            onClick={() => selectTag(inputValue.trim().toUpperCase())}
                            className="w-full text-left px-4 py-2.5 text-sm font-bold tracking-wider text-[#50c878] hover:bg-[#50c878]/10 transition-colors flex items-center gap-2 border-t border-white/5"
                        >
                            <Plus size={12} />
                            Skapa "{inputValue.trim().toUpperCase()}"
                        </button>
                    )}
                </div>
            )}

            {/* Quick pills for existing tags when input is focused and empty */}
            {isOpen && !value && !inputValue && allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {allTags.slice(0, 12).map(tag => (
                        <button
                            key={tag}
                            onClick={() => selectTag(tag)}
                            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagPicker;
