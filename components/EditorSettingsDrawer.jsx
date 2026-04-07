"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutTemplate, Palette, Calendar, Link as LinkIcon, Type, Navigation } from 'lucide-react';
import { CardContent } from './FeedMasonryComponents';
import FileUploadButton from './FileUploadButton';

const TEMPLATES = [
    { id: 'news', name: 'Standard', icon: '📰', defaultProps: { type: 'news', bgColor: 'bg-[#f6f4f1]', textColor: 'text-[#2a2726]', buttonText: 'LÄS MER' } },
    { id: 'quote', name: 'Citat', icon: '💬', defaultProps: { type: 'news', bgColor: 'bg-[#b8a30e]', textColor: 'text-white', fontSize: 'text-2xl font-serif italic' } },
    { id: 'youtube', name: 'YouTube', icon: '▶️', defaultProps: { type: 'youtube', bgColor: 'bg-[#ff0000]', textColor: 'text-white', icon: 'Play', buttonText: 'TITTA NU' } },
    { id: 'twitter', name: 'X/Twitter', icon: '𝕏', defaultProps: { type: 'twitter', bgColor: 'bg-[#15202b]', textColor: 'text-white', icon: 'Twitter', buttonText: 'LÄS TRÅD' } },
    { id: 'book', name: 'Bok', icon: '📚', defaultProps: { type: 'book', bgColor: 'bg-[#f6f4f1]', textColor: 'text-[#2a2726]', buttonText: 'LÄS BOKEN' } },
    { id: 'document', name: 'Dokument', icon: '📄', defaultProps: { type: 'document', bgColor: 'bg-[#2a2726]', textColor: 'text-white', icon: 'File', buttonText: 'LADDA NER' } },
    { id: 'map', name: 'Karta', icon: '📍', defaultProps: { type: 'map', bgColor: 'bg-[#2a2726]', textColor: 'text-white' } },
    { id: 'media', name: 'Media', icon: '🎬', defaultProps: { type: 'media', bgColor: 'bg-[#3ab065]', textColor: 'text-white', icon: 'Play' } },
];

const COLORS = [
    { id: 'light', hex: '#f6f4f1', class: 'bg-[#f6f4f1]' },
    { id: 'dark', hex: '#2a2726', class: 'bg-[#2a2726]' },
    { id: 'twitter', hex: '#15202b', class: 'bg-[#15202b]' },
    { id: 'green', hex: '#50c878', class: 'bg-[#50c878]' },
    { id: 'red', hex: '#e85d4e', class: 'bg-[#e85d4e]' },
    { id: 'yellow', hex: '#b8a30e', class: 'bg-[#b8a30e]' },
    { id: 'orange', hex: '#f4a261', class: 'bg-[#f4a261]' },
];

const EditorSettingsDrawer = ({ isOpen, onClose, formData, onFormChange, activeTemplate, onTemplateSelect, previewData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onFormChange(name, value);
    };

    const handleColorSelect = (color) => {
        onFormChange('bgColor', color.class);
        onFormChange('textColor', color.id === 'light' ? 'text-[#2a2726]' : 'text-white');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-[#1a1818] border-l border-white/10 z-50 overflow-y-auto custom-scrollbar shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-[#1a1818]/95 backdrop-blur-md z-10 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">Artikelinställningar</h2>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-6 space-y-8">

                            {/* Template Selector */}
                            <section>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                    <LayoutTemplate size={12} /> Kortstil
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => onTemplateSelect(t)}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${activeTemplate?.id === t.id
                                                ? 'bg-white/10 border-white/30 text-white'
                                                : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60'
                                                }`}
                                        >
                                            <span className="text-base">{t.icon}</span>
                                            <span className="font-medium text-xs">{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Color Picker */}
                            <section>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                    <Palette size={12} /> Temafärg
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleColorSelect(c)}
                                            className={`w-9 h-9 rounded-full ${c.class} border-2 transition-all hover:scale-110 ${formData.bgColor === c.class ? 'border-white ring-2 ring-white/20 scale-110' : 'border-transparent'}`}
                                            title={c.id}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Date */}
                            <section>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                    <Calendar size={12} /> Publiceringsdatum
                                </h3>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#50c878] appearance-none"
                                />
                            </section>

                            {/* External ID (YouTube/Twitter) */}
                            {(formData.type === 'youtube' || formData.type === 'twitter') && (
                                <section>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                                        {formData.type === 'youtube' ? '▶️ YouTube' : '𝕏 Twitter'} ID / Länk
                                    </h3>
                                    <input
                                        type="text"
                                        name="externalId"
                                        value={formData.externalId}
                                        onChange={handleChange}
                                        placeholder={formData.type === 'youtube' ? 'YouTube URL eller Video ID' : 'Twitter/X Post URL eller ID'}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#50c878] font-mono"
                                    />
                                </section>
                            )}

                            {/* File URL (Document) */}
                            {formData.type === 'document' && (
                                <section>
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                                        📄 Fillänk
                                    </h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="fileUrl"
                                            value={formData.fileUrl}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-[#50c878]"
                                        />
                                        <FileUploadButton
                                            accept="application/pdf,.pdf,.doc,.docx"
                                            onUploadSuccess={(url) => onFormChange('fileUrl', url)}
                                            variant="icon"
                                            label="Ny"
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Button Text */}
                            <section>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                    <Type size={12} /> Knapptext
                                </h3>
                                <input
                                    type="text"
                                    name="buttonText"
                                    value={formData.buttonText}
                                    onChange={handleChange}
                                    placeholder="LÄS MER"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#50c878] uppercase tracking-wider font-bold"
                                />
                            </section>

                            {/* Source */}
                            <section>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                    <LinkIcon size={12} /> Källa
                                </h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        name="sourceText"
                                        value={formData.sourceText}
                                        onChange={handleChange}
                                        placeholder="Källtext (t.ex. Läs originalartikeln)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#50c878]"
                                    />
                                    <input
                                        type="text"
                                        name="sourceLink"
                                        value={formData.sourceLink}
                                        onChange={handleChange}
                                        placeholder="Källans URL (https://...)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#50c878] font-mono"
                                    />
                                </div>
                            </section>

                            {/* Card Preview */}
                            <section>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                                    <Navigation size={12} /> Kortförhandsvisning
                                </h3>
                                <div className="w-full max-w-[280px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-[#46423f]">
                                    <CardContent data={previewData} />
                                </div>
                            </section>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export { TEMPLATES, COLORS };
export default EditorSettingsDrawer;
