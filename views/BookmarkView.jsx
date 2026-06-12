"use client";

import React, { useState, useMemo } from 'react';
import { X, Plus, Bookmark, FolderHeart, Tag, Trash2, Edit2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FadeInCard, CardContent } from "@/components/FeedMasonryComponents";
import CustomModal from "@/components/CustomModal";
import { useMutation, api } from "@/lib/db";

const BookmarkView = ({ articles, allArticles, activeArticle, setActiveArticle, bookmarkCollections, createCollection, isReaderOpen, bundles }) => {
    const [selectedBundle, setSelectedBundle] = useState(null); // null means showing actual bookmarks
    const [isEditingBundle, setIsEditingBundle] = useState(false);
    const [editBundleName, setEditBundleName] = useState('');
    const [editBundleTags, setEditBundleTags] = useState([]);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        confirmText: 'Bekräfta',
        type: 'danger'
    });

    const deleteBundleMutation = useMutation(api.bundles.deleteBundle);
    const removeArticleFromBundleMutation = useMutation(api.bundles.removeArticleFromBundle);
    const updateBundleMutation = useMutation(api.bundles.updateBundle);

    // Get all bookmarked articles
    const bookmarkedArticles = useMemo(() => articles.filter(a => a.isBookmarked), [articles]);

    // Extract all unique tags globally to show in the Edit Modal
    const allAvailableTags = useMemo(() => {
        const t = new Set();
        allArticles.forEach(a => { if (a.tag) t.add(a.tag); });
        return Array.from(t).sort();
    }, [allArticles]);

    // Let's stick to the visual update mainly.
    // I will use SwipeableCard.

    // If a bundle is selected, we filter ALL articles, acting as a smart folder.
    // If no bundle is selected, we just show standard bookmarks.
    const displayArticles = useMemo(() => {
        if (!selectedBundle) return bookmarkedArticles;

        return allArticles.filter(article => {
            // Must have ALL selected tags
            const matchesTags = selectedBundle.tags.includes(article.tag);
            // Must not be explicitly excluded by user
            const isExcluded = selectedBundle.excludedArticles?.includes(article._id) || false;

            return matchesTags && !isExcluded;
        });
    }, [selectedBundle, bookmarkedArticles, allArticles]);

    const handleDeleteBundle = async (e, id) => {
        e.stopPropagation();
        setConfirmConfig({
            isOpen: true,
            title: "Ta bort bundle",
            message: "Är du säker på att du vill ta bort denna bundle? Detta kommer inte att ta bort dina sparade artiklar.",
            confirmText: "Ta bort",
            type: "danger",
            onConfirm: async () => {
                await deleteBundleMutation({ id });
                if (selectedBundle?._id === id) setSelectedBundle(null);
            }
        });
    };

    const handleRemoveArticleFromBundle = async (e, articleId) => {
        e.stopPropagation();
        if (!selectedBundle) return;

        setConfirmConfig({
            isOpen: true,
            title: "Dölj artikel",
            message: "Vill du dölja denna artikel från din bundle?",
            confirmText: "Dölj",
            type: "danger",
            onConfirm: async () => {
                await removeArticleFromBundleMutation({
                    bundleId: selectedBundle._id,
                    articleId: articleId
                });
                // Update selectedBundle state locally for instant UI response before Convex syncs
                setSelectedBundle(prev => ({
                    ...prev,
                    excludedArticles: [...(prev.excludedArticles || []), articleId]
                }));
            }
        });
    };

    const openEditModal = () => {
        if (!selectedBundle) return;
        setEditBundleName(selectedBundle.name);
        setEditBundleTags([...selectedBundle.tags]);
        setIsEditingBundle(true);
    };

    const handleUpdateBundle = async (e) => {
        e.preventDefault();
        if (!editBundleName.trim() || editBundleTags.length === 0 || !selectedBundle) return;

        await updateBundleMutation({
            id: selectedBundle._id,
            name: editBundleName,
            tags: editBundleTags
        });

        // Optimistic UI update
        setSelectedBundle(prev => ({
            ...prev,
            name: editBundleName,
            tags: editBundleTags
        }));
        setIsEditingBundle(false);
    };

    const toggleEditTag = (tag) => {
        setEditBundleTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="min-h-screen bg-bg pt-4 animate-in fade-in duration-500 overflow-y-auto">
            <header className="sticky top-0 left-0 right-0 z-30 bg-bg/92 backdrop-blur-xl border-b border-line pt-6 pb-2 px-6 md:px-8 mb-6 pointer-events-none">
                <div className="max-w-[1600px] mx-auto pointer-events-auto">
                    <h1 className="text-3xl md:text-4xl font-serif text-ink tracking-tight mb-2">Sparat & Bundles</h1>
                    <p className="text-sm text-muted font-sans mb-8">Dina bokmärken och smarta tag-kombinationer.</p>

                    {/* Bundle Navigation Tabs */}
                    <div className="flex overflow-x-auto no-scrollbar gap-3 pb-4 mb-2">
                        <button
                            onClick={() => setSelectedBundle(null)}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border
                            ${selectedBundle === null
                                    ? 'bg-ink text-bg border-ink shadow-lg'
                                    : 'bg-card text-dek border-line hover:bg-surface'}`}
                        >
                            <Bookmark size={16} className={selectedBundle === null ? 'fill-current' : ''} />
                            Alla Bokmärken
                        </button>

                        {bundles && bundles.map(bundle => (
                            <div key={bundle._id} className="relative group">
                                <button
                                    onClick={() => setSelectedBundle(bundle)}
                                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border
                                    ${selectedBundle?._id === bundle._id
                                            ? 'bg-accent text-accent-ink border-accent shadow-lg shadow-accent/20'
                                            : 'bg-card text-dek border-line hover:bg-surface'}`}
                                >
                                    <FolderHeart size={16} className={selectedBundle?._id === bundle._id ? 'fill-current opacity-20' : ''} />
                                    {bundle.name}
                                </button>
                                <button
                                    onClick={(e) => handleDeleteBundle(e, bundle._id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md hover:bg-red-600 hover:scale-110"
                                    title="Ta bort bundle"
                                >
                                    <X size={12} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* Active Bundle Info */}
            {selectedBundle && (
                <div className="max-w-[1600px] mx-auto px-6 md:px-8 mb-6 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-muted uppercase tracking-widest mr-2">Taggar:</span>
                        {selectedBundle.tags.map(t => (
                            <span key={t} className="bg-card text-ink px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                <Tag size={10} className="text-accent" /> {t}
                            </span>
                        ))}
                        <button
                            onClick={openEditModal}
                            className="ml-auto flex items-center gap-2 text-xs font-bold text-muted hover:text-ink transition-colors bg-card px-3 py-1.5 rounded-full border border-line hover:border-line"
                        >
                            <Edit2 size={12} /> Redigera
                        </button>
                    </div>
                </div>
            )}

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-32">
                {displayArticles.length === 0 ? (
                    <div className="text-center py-20 text-muted bg-card rounded-[2.5rem] border border-line mx-2">
                        {selectedBundle ? (
                            <>
                                <FolderHeart size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-serif text-xl mb-2 text-ink">Inga artiklar i denna bundle</p>
                                <p className="text-sm font-sans px-8">När nya artiklar publiceras med taggarna ovan kommer de automatiskt att dyka upp här.</p>
                            </>
                        ) : (
                            <>
                                <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-serif text-xl mb-2 text-ink">Inga bokmärken</p>
                                <p className="text-sm font-sans px-8">Klicka på bokmärkesikonen på en artikel för att spara den här.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="px-2 text-xs font-bold text-faint uppercase tracking-widest mb-6">
                            {displayArticles.length} {selectedBundle ? 'i denna bundle' : 'sparade artiklar'}
                        </p>
                        <div className="w-full flex justify-center px-4">
                            <div className="w-full max-w-[340px] md:max-w-[704px] xl:max-w-[1068px]">
                                <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
                                    {displayArticles.map((article, index) => (
                                        <div key={`bookmark-wrapper-${article.id}`} className="relative group">
                                            <FadeInCard
                                                index={index}
                                                onClick={() => setActiveArticle(article)}
                                            >
                                                <div className="pointer-events-none h-full w-full">
                                                    <CardContent data={article} />
                                                </div>
                                            </FadeInCard>

                                            {/* Remove from Bundle Overlay Button */}
                                            {selectedBundle && (
                                                <button
                                                    onClick={(e) => handleRemoveArticleFromBundle(e, article._id)}
                                                    className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-md"
                                                    title="Dölj från denna bundle"
                                                >
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Edit Bundle Modal */}
            <AnimatePresence>
                {isEditingBundle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsEditingBundle(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-card rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden text-ink border border-line"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-line">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                                    <Edit2 size={16} /> Redigera Bundle
                                </h2>
                                <button onClick={() => setIsEditingBundle(false)} className="text-muted hover:text-ink transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateBundle} className="p-6">
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest mb-2 block">Namnge din Bundle</label>
                                    <input
                                        type="text"
                                        required
                                        value={editBundleName}
                                        onChange={(e) => setEditBundleName(e.target.value)}
                                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent text-ink placeholder:text-faint"
                                    />
                                </div>

                                <label className="text-xs font-bold text-muted uppercase tracking-widest mb-3 block">Valda Taggar</label>
                                <div className="flex flex-wrap gap-2 mb-8 max-h-32 overflow-y-auto custom-scrollbar">
                                    {allAvailableTags.map(tag => {
                                        const isSelected = editBundleTags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleEditTag(tag)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 border
                                                ${isSelected
                                                        ? 'bg-accent border-accent text-accent-ink'
                                                        : 'bg-card border-line text-dek hover:bg-surface hover:border-line'
                                                    }`}
                                            >
                                                <Tag size={10} className={isSelected ? 'text-accent-ink/70' : 'text-muted'} />
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!editBundleName.trim() || editBundleTags.length === 0}
                                    className="w-full bg-accent text-accent-ink font-bold py-3 rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                                >
                                    Spara Ändringar
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CustomModal
                {...confirmConfig}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default BookmarkView;
