"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, api } from "@/lib/db";
import { Plus, Edit2, Trash2, Search, Calendar, Tag, AlertCircle } from 'lucide-react';
import CustomModal from "@/components/CustomModal";

const AdminDashboardView = ({ onNewPost, onEditPost }) => {
    const articles = useQuery(api.articles.getAll);
    const deleteArticle = useMutation(api.articles.remove);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeletingId, setIsDeletingId] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        confirmText: 'Bekräfta',
        type: 'danger'
    });

    const handleDelete = async (id) => {
        setConfirmConfig({
            isOpen: true,
            title: "Radera artikel",
            message: "Är du säker på att du vill radera denna artikel? Detta kan inte ångras.",
            confirmText: "Radera permanent",
            type: "danger",
            onConfirm: async () => {
                setIsDeletingId(id);
                try {
                    await deleteArticle({ id });
                } catch (err) {
                    console.error("Misslyckades med att radera:", err);
                    setConfirmConfig({
                        isOpen: true,
                        title: "Ett fel uppstod",
                        message: "Kunde inte radera artikeln. Det kan bero på nätverksproblem eller rättigheter.",
                        confirmText: "Okej",
                        type: "danger",
                        onConfirm: () => { }
                    });
                } finally {
                    setIsDeletingId(null);
                }
            }
        });
    };

    if (articles === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#2a2726]">
                <div className="w-8 h-8 border-2 border-[#50c878] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredArticles = articles.filter(a =>
        (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.tag || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#2a2726] text-[#f6f4f1] p-6 lg:p-12 animate-in fade-in duration-500 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-serif tracking-tight mb-2">Innehållshantering</h1>
                        <p className="text-white/50 font-sans text-sm">Hantera publicerade inlägg, skapa nya eller ändra befintliga ({articles.length} totalt).</p>
                    </div>
                    <button
                        onClick={onNewPost}
                        className="bg-[#50c878] text-[#2a2726] px-6 py-3 rounded-full font-bold text-sm tracking-wide flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        <Plus size={18} /> Skapa Nytt Inlägg
                    </button>
                </header>

                {/* Filters / Search */}
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-2 mb-8 max-w-md items-center focus-within:bg-white/10 focus-within:border-white/20 transition-colors">
                    <Search size={18} className="text-white/40 ml-3 mr-2" />
                    <input
                        type="text"
                        placeholder="Sök inlägg, titlar eller taggar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-sm text-white w-full py-2 focus:outline-none placeholder:text-white/30"
                    />
                </div>

                {/* Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-sm">
                            <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-white/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Titel & Typ</th>
                                    <th className="px-6 py-4 font-bold hidden md:table-cell">Kategori</th>
                                    <th className="px-6 py-4 font-bold hidden sm:table-cell">Publicerad</th>
                                    <th className="px-6 py-4 font-bold text-right">Åtgärder</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredArticles.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-white/40">
                                            <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
                                            Inga artiklar hittades.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredArticles.map(article => (
                                        <tr key={article._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-base mb-1 truncate max-w-[200px] md:max-w-md">{article.title || 'Utan titel'}</div>
                                                <div className="text-xs text-white/40 flex items-center gap-1.5 uppercase tracking-wide">
                                                    <div className={`w-2 h-2 rounded-full ${article.bgColor ? article.bgColor.split(' ')[0].replace('bg-', 'bg-') : 'bg-white'}`}></div>
                                                    {article.type || 'Standard'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                {article.tag ? (
                                                    <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/70">
                                                        {article.tag}
                                                    </span>
                                                ) : <span className="text-white/20">—</span>}
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell text-white/60">
                                                {new Date(article.date).toLocaleDateString('sv-SE', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onEditPost(article)}
                                                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                        title="Redigera"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(article._id)}
                                                        disabled={isDeletingId === article._id}
                                                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                                        title="Radera"
                                                    >
                                                        {isDeletingId === article._id ? (
                                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <CustomModal
                {...confirmConfig}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AdminDashboardView;
