"use client";

import React, { useRef, useEffect } from 'react';

const AutoGrowTextarea = ({ value, onChange, className = '', placeholder = '', name = '', ...props }) => {
    const ref = useRef(null);

    const resize = () => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    };

    useEffect(() => {
        resize();
    }, [value]);

    return (
        <textarea
            ref={ref}
            name={name}
            value={value}
            onChange={(e) => {
                onChange(e);
                resize();
            }}
            placeholder={placeholder}
            className={`w-full bg-transparent resize-none overflow-hidden focus:outline-none ${className}`}
            rows={1}
            {...props}
        />
    );
};

export default AutoGrowTextarea;
