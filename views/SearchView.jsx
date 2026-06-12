"use client";

import React, { useState, useMemo } from 'react';
import { Search, FolderPlus, X, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        const q = searchQuery.trim().toLowerCase();
        return articles.filter(article => {
            // Text search match — title, dek, tag and source all count
            const matchesSearch = q === '' ||
                (article.title || '').toLowerCase().includes(q) ||
                (article.summary || article.description || '').toLowerCase().includes(q) ||
                (article.tag || article.category || '').toLowerCase().includes(q) ||
                (article.source || article.author || '').toLowerCase().includes(q);

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
        <div className="min-h-screen bg-bg pt-4 animate-in fade-in duration-500 overflow-y-auto">
            {/* Sticky Header */}
            <header className="sticky top-0 left-0 right-0 z-30 bg-bg/92 backdrop-blur-xl border-b border-line pt-6 pb-4 px-6 md:px-8 mb-6 pointer-events-none">
                <div className="max-w-[1600px] mx-auto pointer-events-auto">
                    <h1 className="text-3xl md:text-4xl font-serif text-ink tracking-tight mb-6">Upptäck</h1>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-muted" />
                        </div>
                        <input
                            type="text"
                            placeholder="Sök artiklar, taggar eller källor…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-line rounded-2xl pl-12 pr-12 py-4 text-ink placeholder:text-muted focus:outline-none focus:border-accent focus:bg-surface transition-colors font-sans"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                aria-label="Rensa sökning"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-ink transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Tags Section */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Filtrera på taggar</h2>
                            {selectedTags.length > 0 && (
                                <button
                                    onClick={() => setIsSavingBundle(true)}
                                    className="text-xs font-bold text-accent bg-accent-soft px-3 py-1 rounded-full flex items-center gap-1 hover:bg-accent-soft transition-colors"
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
                                                ? 'bg-accent border-accent text-accent-ink'
                                                : 'bg-card border-line text-dek hover:bg-surface hover:border-line'
                                            }`}
                                    >
                                        <Tag size={12} className={isSelected ? 'text-accent-ink/70' : 'text-muted'} />
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
                    <div className="text-center py-20 text-muted">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-sans">Inga artiklar hittades för dina val.</p>
                    </div>
                ) : (
                    <>
                        <p className="px-2 text-xs font-bold text-faint uppercase tracking-widest mb-6">
                            {filteredArticles.length} resultat
                        </p>
                        <div className="w-full flex justify-center px-4">
                            <div className="w-full max-w-[340px] md:max-w-[704px] xl:max-w-[1068px]">
                                <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
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
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsSavingBundle(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-card rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden text-ink border border-line"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-line">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                                    <FolderPlus size={16} /> Ny Bundle
                                </h2>
                                <button onClick={() => setIsSavingBundle(false)} className="text-muted hover:text-ink transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveBundle} className="p-6">
                                <p className="text-sm text-dek mb-4 leading-relaxed font-sans">
                                    Spara kombinationen av dessa taggar som en dynamisk bundle. Nya artiklar med dessa taggar visas automatiskt här.
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                    {selectedTags.map(t => (
                                        <span key={t} className="bg-card text-dek px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{t}</span>
                                    ))}
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">Namnge din Bundle</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={bundleName}
                                        onChange={(e) => setBundleName(e.target.value)}
                                        placeholder="T.ex. AI & Design"
                                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-ink placeholder:text-faint"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!bundleName.trim()}
                                    className="w-full bg-accent text-accent-ink font-bold py-3 rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
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
