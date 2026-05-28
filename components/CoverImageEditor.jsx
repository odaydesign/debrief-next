"use client";

import React, { useRef, useState } from 'react';
import { ImageIcon, Upload, Crosshair, X, Palette } from 'lucide-react';
import { uploadFile } from "@/lib/db";

const CoverImageEditor = ({
    imageUrl,
    focalX = 50,
    focalY = 50,
    onImageChange,
    onFocalPointChange,
    onAutoTheme,
    isExtractingColor = false,
}) => {
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    const handleImageClick = (e) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onFocalPointChange(
            Math.max(0, Math.min(100, Math.round(x * 10) / 10)),
            Math.max(0, Math.min(100, Math.round(y * 10) / 10))
        );
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const publicUrl = await uploadFile(file);
            if (publicUrl) onImageChange(publicUrl);
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (urlInput.trim()) {
            onImageChange(urlInput.trim());
            setUrlInput('');
            setShowUrlInput(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setIsUploading(true);
        try {
            const publicUrl = await uploadFile(file);
            if (publicUrl) onImageChange(publicUrl);
        } catch (err) {
            console.error("Upload error:", err);
        } finally {
            setIsUploading(false);
        }
    };

    // No image — upload zone
    if (!imageUrl) {
        return (
            <div
                className={`relative w-full rounded-2xl border-2 border-dashed transition-colors cursor-pointer group mb-8 ${isDragging ? 'border-[#50c878] bg-[#50c878]/5' : 'border-white/15 hover:border-white/30 bg-white/[0.02]'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    {isUploading ? (
                        <>
                            <div className="w-8 h-8 border-2 border-[#50c878] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm text-[#50c878]">Laddar upp...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                                <ImageIcon size={24} className="text-white/30 group-hover:text-white/50 transition-colors" />
                            </div>
                            <p className="text-sm font-medium text-white/50 mb-1">Dra & släpp eller klicka för att ladda upp</p>
                            <p className="text-xs text-white/25">JPG, PNG, GIF, WebP</p>
                        </>
                    )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                {/* URL input toggle */}
                <div className="absolute bottom-3 right-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {showUrlInput ? (
                        <form onSubmit={handleUrlSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://..."
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#50c878] w-56"
                                autoFocus
                            />
                            <button type="submit" className="text-xs font-bold text-[#50c878] hover:text-white transition-colors">OK</button>
                            <button type="button" onClick={() => setShowUrlInput(false)} className="text-xs text-white/30 hover:text-white/60"><X size={14} /></button>
                        </form>
                    ) : (
                        <button onClick={() => setShowUrlInput(true)} className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors bg-black/20 px-3 py-1.5 rounded-lg">
                            Klistra in URL
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Image set — show thumbnail with focal point
    return (
        <div className="relative w-full mb-8 group">
            {/* Image with focal point */}
            <div
                className="relative w-full rounded-2xl overflow-hidden cursor-crosshair bg-[#1a1818]"
                onClick={handleImageClick}
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Cover"
                    className="w-full max-h-[400px] object-cover"
                    style={{ objectPosition: `${focalX}% ${focalY}%` }}
                    draggable={false}
                />

                {/* Focal point indicator */}
                <div
                    className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ left: `${focalX}%`, top: `${focalY}%` }}
                >
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.3)] animate-pulse" />
                    {/* Crosshair */}
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/80 shadow-sm" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/80 shadow-sm" />
                    {/* Center dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-lg" />
                </div>

                {/* Overlay hint */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Crosshair size={12} /> Klicka för att sätta fokuspunkt
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5"
                >
                    <Upload size={12} /> Byt bild
                </button>
                <button
                    onClick={onAutoTheme}
                    disabled={isExtractingColor}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-30"
                >
                    <Palette size={12} /> {isExtractingColor ? 'Laddar...' : 'Auto-Tema'}
                </button>
                <button
                    onClick={() => { onImageChange(''); onFocalPointChange(50, 50); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5 ml-auto"
                >
                    <X size={12} /> Ta bort
                </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
    );
};

export default CoverImageEditor;
