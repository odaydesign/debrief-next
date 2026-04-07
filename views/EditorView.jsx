"use client";

import React, { useState } from 'react';
import { ArrowLeft, Check, Settings } from 'lucide-react';
import RichTextEditor from "@/components/RichTextEditor";
import AutoGrowTextarea from "@/components/AutoGrowTextarea";
import TagPicker from "@/components/TagPicker";
import CoverImageEditor from "@/components/CoverImageEditor";
import EditorSettingsDrawer, { TEMPLATES } from "@/components/EditorSettingsDrawer";
import CustomModal from "@/components/CustomModal";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { extractThemeFromImage } from "@/lib/colorUtils";

const EditorView = ({ articleToEdit, onPublish, onCancel }) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, confirmText: 'Okej', type: 'info'
    });

    const initialTemplate = articleToEdit
        ? TEMPLATES.find(t => t.defaultProps.type === articleToEdit.type && t.defaultProps.bgColor === articleToEdit.bgColor) || TEMPLATES[0]
        : TEMPLATES[0];

    const [activeTemplate, setActiveTemplate] = useState(initialTemplate);
    const [formData, setFormData] = useState({
        title: articleToEdit?.title || '',
        description: articleToEdit?.summary || '',
        content: articleToEdit?.content ? articleToEdit.content.replace(/<\/?p>/g, '\n\n').trim() : '',
        image: articleToEdit?.image || '',
        tag: articleToEdit?.tag || '',
        tagStyle: articleToEdit?.tagStyle || 'bg-[#50c878] text-white',
        buttonText: articleToEdit?.buttonText || 'LÄS MER',
        bgColor: articleToEdit?.bgColor || TEMPLATES[0].defaultProps.bgColor,
        textColor: articleToEdit?.textColor || TEMPLATES[0].defaultProps.textColor,
        type: articleToEdit?.type || TEMPLATES[0].defaultProps.type,
        imageType: articleToEdit?.imageType || '',
        visual: articleToEdit?.visual || '',
        date: articleToEdit?.date ? new Date(articleToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        externalId: articleToEdit?.externalId || '',
        fileUrl: articleToEdit?.fileUrl || '',
        sourceLink: articleToEdit?.sourceLink || '',
        sourceText: articleToEdit?.sourceText || '',
        imageFocalX: articleToEdit?.imageFocalX ?? 50,
        imageFocalY: articleToEdit?.imageFocalY ?? 50,
    });

    const [isExtractingColor, setIsExtractingColor] = useState(false);

    const handleAutoTheme = async () => {
        if (!formData.image) return;
        setIsExtractingColor(true);
        try {
            const theme = await extractThemeFromImage(formData.image);
            setFormData(prev => ({
                ...prev,
                bgColor: theme.bgColor,
                textColor: theme.textColor,
                tagStyle: theme.tagStyle
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsExtractingColor(false);
        }
    };

    const handleTemplateSelect = (template) => {
        setActiveTemplate(template);
        setFormData(prev => ({ ...prev, ...template.defaultProps }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormFieldChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const create = useMutation(api.articles.create);
    const update = useMutation(api.articles.update);

    const handlePublish = async () => {
        if (!formData.title) {
            setModalConfig({
                isOpen: true, title: "Titel saknas",
                message: "Du måste ange en titel för att kunna publicera.",
                confirmText: "Okej", type: "info", onConfirm: () => { }
            });
            return;
        }
        setIsPublishing(true);

        let finalExternalId = formData.externalId;
        if (formData.type === 'twitter' && finalExternalId) {
            const match = finalExternalId.match(/(?:twitter\.com|x\.com)\/.*\/status\/(\d+)/);
            if (match) finalExternalId = match[1];
            else if (finalExternalId.includes('?')) finalExternalId = finalExternalId.split('?')[0];
        } else if (formData.type === 'youtube' && finalExternalId) {
            const ytMatch = finalExternalId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (ytMatch) finalExternalId = ytMatch[1];
        }

        const payload = {
            ...formData,
            externalId: finalExternalId,
            title: formData.title || 'Untitled',
            summary: formData.description,
            date: new Date(formData.date).toISOString(),
            content: formData.content,
            imageFocalX: formData.imageFocalX,
            imageFocalY: formData.imageFocalY,
        };

        try {
            if (articleToEdit?._id) {
                await update({ id: articleToEdit._id, ...payload });
            } else {
                await create(payload);
            }
        } catch (err) {
            console.error(err);
            setModalConfig({
                isOpen: true, title: "Publiceringsfel",
                message: "Ett fel uppstod. Försök igen.",
                confirmText: "Okej", type: "danger", onConfirm: () => { }
            });
        }

        setTimeout(() => {
            setIsPublishing(false);
            onPublish();
        }, 600);
    };

    // Preview data for settings drawer card preview
    let previewExternalId = formData.externalId;
    if (formData.type === 'twitter' && previewExternalId) {
        const match = previewExternalId.match(/(?:twitter\.com|x\.com)\/.*\/status\/(\d+)/);
        if (match) previewExternalId = match[1];
        else if (previewExternalId.includes('?')) previewExternalId = previewExternalId.split('?')[0];
    } else if (formData.type === 'youtube' && previewExternalId) {
        const ytMatch = previewExternalId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch) previewExternalId = ytMatch[1];
    }

    const previewData = {
        ...formData,
        externalId: previewExternalId,
        date: formData.date ? new Date(formData.date) : new Date(),
        summary: formData.description || 'Description preview...',
        title: formData.title || 'Type a title to preview...',
    };

    return (
        <div className="min-h-screen bg-[#2a2726] text-[#f6f4f1]">

            {/* Sticky Top Bar */}
            <header className="sticky top-0 z-30 bg-[#2a2726]/90 backdrop-blur-md border-b border-white/[0.06]">
                <div className="max-w-[900px] mx-auto px-6 py-3 flex justify-between items-center">
                    <button onClick={onCancel} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Tillbaka</span>
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Settings gear */}
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className={`p-2.5 rounded-xl transition-colors ${isDrawerOpen ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            title="Inställningar"
                        >
                            <Settings size={18} />
                        </button>

                        {/* Publish */}
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="bg-[#50c878] text-[#2a2726] px-5 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isPublishing ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Check size={15} />
                            )}
                            {isPublishing ? 'Publicerar...' : 'Publicera'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Full-width Writing Surface */}
            <main className="max-w-[720px] mx-auto px-6 py-10 md:py-16">

                {/* Cover Image */}
                <CoverImageEditor
                    imageUrl={formData.image}
                    focalX={formData.imageFocalX}
                    focalY={formData.imageFocalY}
                    onImageChange={(url) => handleFormFieldChange('image', url)}
                    onFocalPointChange={(x, y) => {
                        setFormData(prev => ({ ...prev, imageFocalX: x, imageFocalY: y }));
                    }}
                    onAutoTheme={handleAutoTheme}
                    isExtractingColor={isExtractingColor}
                />

                {/* Tag Picker */}
                <div className="mb-6">
                    <TagPicker
                        value={formData.tag}
                        onChange={(tag) => handleFormFieldChange('tag', tag)}
                    />
                </div>

                {/* Title */}
                <AutoGrowTextarea
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Titel..."
                    className="text-4xl md:text-5xl font-serif text-white placeholder-white/15 leading-tight tracking-tight mb-4"
                />

                {/* Description / Ingress */}
                <AutoGrowTextarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Kort sammanfattning eller ingress..."
                    className="text-lg md:text-xl text-white/60 placeholder-white/15 leading-relaxed mb-10 font-sans"
                />

                {/* Divider */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

                {/* Rich Text Editor — borderless, Medium-style */}
                <RichTextEditor
                    content={formData.content}
                    onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                    placeholder="Börja skriva din artikel..."
                />

            </main>

            {/* Settings Drawer */}
            <EditorSettingsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                formData={formData}
                onFormChange={handleFormFieldChange}
                activeTemplate={activeTemplate}
                onTemplateSelect={handleTemplateSelect}
                previewData={previewData}
            />

            <CustomModal
                {...modalConfig}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default EditorView;
