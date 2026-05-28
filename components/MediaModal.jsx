"use client";

import React, { useState, useRef } from 'react';
import { uploadFile } from "@/lib/db";
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Play, AlertCircle } from 'lucide-react';

const MediaModal = ({ isOpen, onClose, onInsert, initialTab = 'upload' }) => {
    const [activeTab, setActiveTab] = useState(initialTab); // 'upload' or 'url'
    const [urlInput, setUrlInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        // Basic validation for URL
        try {
            new URL(urlInput);
            onInsert(urlInput);
            setUrlInput('');
            onClose();
        } catch (err) {
            setError("Vänligen ange en giltig URL (t.ex. https://...)");
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            // We can handle multiple files by looping
            for (const file of files) {
                // Upload to Firebase Storage and get the public download URL.
                const publicUrl = await uploadFile(file);

                if (!publicUrl) throw new Error("Could not retrieve file URL");

                onInsert(publicUrl);
            }
            onClose();
        } catch (err) {
            console.error("Upload error:", err);
            setError("Kunde inte ladda upp filen. Försök igen.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-[#2a2726]/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#1a1818] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden text-[#f6f4f1] border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#50c878] flex items-center gap-2">
                        {initialTab === 'youtube' ? <><Play size={16} /> Infoga YouTube</> : <><ImageIcon size={16} /> Lägg till Media</>}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex px-6 pt-4 border-b border-white/5">
                    {initialTab !== 'youtube' && (
                        <button
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'upload' ? 'border-[#50c878] text-[#50c878]' : 'border-transparent text-white/50 hover:text-white/80'}`}
                            onClick={() => setActiveTab('upload')}
                        >
                            Ladda Upp
                        </button>
                    )}
                    <button
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'url' ? 'border-[#50c878] text-[#50c878]' : 'border-transparent text-white/50 hover:text-white/80'}`}
                        onClick={() => setActiveTab('url')}
                    >
                        Länk (URL)
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {activeTab === 'upload' && initialTab !== 'youtube' && (
                        <div className="space-y-4">
                            <div
                                className="border-2 border-dashed border-white/20 hover:border-[#50c878]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-white/5 hover:bg-white/10"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={32} className="mb-4 text-white/40 group-hover:text-[#50c878] transition-colors" />
                                <p className="text-sm font-bold text-white mb-1">Klicka för att ladda upp</p>
                                <p className="text-xs text-white/50">Stöder JPG, PNG, GIF (Max 5MB)</p>
                                <p className="text-[10px] text-white/30 tracking-widest uppercase mt-4">Välj flera bilder samtidigt</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="image/*"
                                multiple
                            />
                            {isUploading && (
                                <p className="text-xs text-center text-[#50c878] animate-pulse">Laddar upp filer...</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'url' && (
                        <form onSubmit={handleUrlSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                    <LinkIcon size={14} /> Ange URL
                                </label>
                                <input
                                    type="text"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder={initialTab === 'youtube' ? "https://youtube.com/watch?v=..." : "https://exempel.se/bild.jpg"}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#50c878] text-white placeholder-white/20"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!urlInput.trim()}
                                className="w-full bg-[#50c878] text-[#1a1818] font-bold py-3 rounded-xl hover:bg-[#43a865] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                            >
                                Infoga Media
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaModal;
