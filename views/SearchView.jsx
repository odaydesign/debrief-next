"use client";

import React, { useState, useMemo } from 'react';
import { Search, FolderPlus, X, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableCard from "@/components/SwipeableCard";
import { FadeInCard, CardContent } from "@/components/FeedMasonryComponents";
import CustomModal from "@/components/CustomModal";
import { useMutation, api } from "@/lib/db";

const SearchView = ({ articles, activeArticle, setActiveArticle, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSavingBundle, setIsSavingBundle] = useState(false);
    const [bundleName, setBundleName] = useState('');

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        confirmText: 'Okej',
        type: 'info'
    });

    const createBundleMutation = useMutation(api.bundles.createBundle);

    // Extract all unique tags from articles
    const allTags = useMemo(() => {
        const tags = new Set();
        articles.forEach(a => {
            if (a.tag) tags.add(a.tag);
        });
        return Array.from(tags).sort();
    }, [articles]);

    // Filter articles based on search text AND selected tags
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            // Text search match
            const matchesSearch = searchQuery === '' ||
                article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (article.summary && article.summary.toLowerCase().includes(searchQuery.toLowerCase()));

            // Tag combination match (must have ALL selected tags, but since our schema currently only supports 1 tag per article, 
            // we will treat it as "matches ANY selected tag" for now. If you update your schema to v.array() later, change this to every())
            const matchesTags = selectedTags.length === 0 || selectedTags.includes(article.tag);

            return matchesSearch && matchesTags;
        });
    }, [articles, searchQuery, selectedTags]);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSaveBundle = async (e) => {
        e.preventDefault();
        if (!bundleName.trim() || selectedTags.length === 0 || !user) return;

        try {
            await createBundleMutation({
                userId: user.id,
                name: bundleName,
                tags: selectedTags,
            });
            setIsSavingBundle(false);
            setBundleName('');
            setModalConfig({
                isOpen: true,
                title: "Bundle sparad!",
                message: "Din smarta mapp har skapats och kan nu hittas bland dina Sparade bokmärken.",
                confirmText: "Okej",
                type: "success",
                onConfirm: () => { }
            });
        } catch (error) {
            console.error("Failed to save bundle:", error);
            setModalConfig({
                isOpen: true,
                title: "Ett fel uppstod",
                message: "Kunde inte spara bundle. Vänligen försök igen.",
                confirmText: "Okej",
                type: "danger",
                onConfirm: () => { }
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#46423f] pt-4 animate-in fade-in duration-500 overflow-y-auto">
            {/* Sticky Header */}
            <header className="sticky top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#46423f]/95 via-[#46423f]/90 to-transparent backdrop-blur-[2px] pt-6 pb-2 px-6 md:px-8 mb-6 pointer-events-none">
                <div className="max-w-[1600px] mx-auto pointer-events-auto">
                    <h1 className="text-3xl md:text-4xl font-serif text-[#f6f4f1] drop-shadow-md tracking-tight mb-6">Upptäck</h1>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-white/40" />
                        </div>
                        <input
                            type="text"
                            placeholder="Sök artiklar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[#f6f4f1] placeholder-white/40 focus:outline-none focus:border-[#50c878] focus:bg-white/15 transition-colors font-sans"
                        />
                    </div>

                    {/* Tags Section */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Filtrera på taggar</h2>
                            {selectedTags.length > 0 && (
                                <button
                                    onClick={() => setIsSavingBundle(true)}
                                    className="text-xs font-bold text-[#50c878] bg-[#50c878]/10 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-[#50c878]/20 transition-colors"
                                >
                                    <FolderPlus size={14} />
                                    Spara som Bundle
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold font-sans transition-all flex items-center gap-1.5 border
                                        ${isSelected
                                                ? 'bg-[#50c878] border-[#50c878] text-[#1a1818]'
                                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <Tag size={12} className={isSelected ? 'text-[#1a1818]/70' : 'text-white/40'} />
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Results */}
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-32">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-20 text-white/40">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-sans">Inga artiklar hittades för dina val.</p>
                    </div>
                ) : (
                    <>
                        <p className="px-2 text-xs font-bold text-white/30 uppercase tracking-widest mb-6">
                            {filteredArticles.length} resultat
                        </p>
                        <div className="w-full flex justify-center px-4">
                            <div className="w-full max-w-[340px] md:max-w-[704px] xl:max-w-[1068px] 2xl:max-w-[1432px]">
                                <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-6 space-y-6">
                                    {filteredArticles.map((article, index) => (
                                        <FadeInCard
                                            key={`search-${article.id}`}
                                            index={index}
                                            onClick={() => setActiveArticle(article)}
                                        >
                                            <div className="pointer-events-none h-full w-full">
                                                <CardContent data={article} />
                                            </div>
                                        </FadeInCard>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Save Bundle Modal */}
            <AnimatePresence>
                {isSavingBundle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#2a2726]/80 backdrop-blur-sm"
                            onClick={() => setIsSavingBundle(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-[#1a1818] rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden text-[#f6f4f1] border border-white/10"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/10">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-[#50c878] flex items-center gap-2">
                                    <FolderPlus size={16} /> Ny Bundle
                                </h2>
                                <button onClick={() => setIsSavingBundle(false)} className="text-white/50 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveBundle} className="p-6">
                                <p className="text-sm text-white/70 mb-4 leading-relaxed font-sans">
                                    Spara kombinationen av dessa taggar som en dynamisk bundle. Nya artiklar med dessa taggar visas automatiskt här.
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {selectedTags.map(t => (
                                        <span key={t} className="bg-white/10 text-white/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{t}</span>
                                    ))}
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Namnge din Bundle</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={bundleName}
                                        onChange={(e) => setBundleName(e.target.value)}
                                        placeholder="T.ex. AI & Design"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#50c878] text-white placeholder-white/20"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!bundleName.trim()}
                                    className="w-full bg-[#50c878] text-[#1a1818] font-bold py-3 rounded-xl hover:bg-[#43a865] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                                >
                                    Spara Bundle
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CustomModal
                {...modalConfig}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default SearchView;
