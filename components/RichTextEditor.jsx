"use client";

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
    Bold, Italic, Link as LinkIcon, Heading1, Heading2, Heading3,
    Quote, ImageIcon, Unlink, List, ListOrdered, Play,
    AlignLeft, AlignCenter, AlignRight, Minus, Plus
} from 'lucide-react';
import MediaModal from './MediaModal';

const RichTextEditor = ({ content, onChange, placeholder = 'Börja skriva din artikel här...' }) => {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [mediaModalType, setMediaModalType] = useState('upload');
    const [isFloatingExpanded, setIsFloatingExpanded] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                horizontalRule: true,
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-xl max-h-[600px] w-full object-cover my-8 shadow-md',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#50c878] underline underline-offset-4 decoration-[#50c878]/30 hover:decoration-[#50c878] transition-colors',
                },
            }),
            Youtube.configure({
                controls: true,
                HTMLAttributes: {
                    class: 'w-full aspect-video rounded-xl overflow-hidden my-8 shadow-md',
                }
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-white/20 before:pointer-events-none before:font-serif before:text-xl',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-xl max-w-none focus:outline-none min-h-[200px] leading-relaxed',
            },
        },
    });

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        setMediaModalType('upload');
        setIsMediaModalOpen(true);
    }, []);

    const addYoutubeVideo = useCallback(() => {
        setMediaModalType('youtube');
        setIsMediaModalOpen(true);
    }, []);

    const addDivider = useCallback(() => {
        editor.chain().focus().setHorizontalRule().run();
        setIsFloatingExpanded(false);
    }, [editor]);

    const handleMediaInsert = (url) => {
        if (mediaModalType === 'upload') {
            editor.chain().focus().setImage({ src: url }).run();
        } else if (mediaModalType === 'youtube') {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }
    };

    if (!editor) return null;

    const ToolBtn = ({ onClick, isActive, children, title }) => (
        <button
            onClick={onClick}
            className={`p-1.5 rounded-md hover:bg-white/15 transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className="relative w-full">
            {/* Custom prose styles for Medium feel */}
            <style>{`
                .ProseMirror {
                    font-family: 'Playfair Display', Georgia, serif;
                }
                .ProseMirror p {
                    font-family: 'Inter', -apple-system, sans-serif;
                    font-size: 1.125rem;
                    line-height: 1.85;
                    color: rgba(246, 244, 241, 0.85);
                    margin-bottom: 1.5rem;
                }
                .ProseMirror h1 {
                    font-family: 'Playfair Display', serif;
                    font-size: 2.25rem;
                    font-weight: 600;
                    color: #f6f4f1;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    line-height: 1.2;
                }
                .ProseMirror h2 {
                    font-family: 'Playfair Display', serif;
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #f6f4f1;
                    margin-top: 2rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.3;
                }
                .ProseMirror h3 {
                    font-family: 'Inter', sans-serif;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: rgba(246, 244, 241, 0.9);
                    margin-top: 1.75rem;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .ProseMirror blockquote {
                    border-left: 3px solid #50c878;
                    padding-left: 1.25rem;
                    margin: 2rem 0;
                    font-style: italic;
                    color: rgba(246, 244, 241, 0.7);
                }
                .ProseMirror hr {
                    border: none;
                    height: 1px;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent);
                    margin: 3rem 0;
                }
                .ProseMirror ul, .ProseMirror ol {
                    font-family: 'Inter', sans-serif;
                    font-size: 1.125rem;
                    color: rgba(246, 244, 241, 0.85);
                    padding-left: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .ProseMirror li {
                    margin-bottom: 0.5rem;
                }
                .ProseMirror a {
                    color: #50c878;
                }
                .ProseMirror img {
                    border-radius: 0.75rem;
                    margin: 2rem 0;
                }
                .ProseMirror .is-empty::before {
                    color: rgba(255, 255, 255, 0.15);
                    font-family: 'Inter', sans-serif;
                    font-style: normal;
                }
            `}</style>

            {/* Bubble Menu (text selection) */}
            {editor && (
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 150, zIndex: 100 }}
                    className="flex items-center gap-0.5 bg-[#111] border border-white/15 shadow-2xl rounded-xl p-1 z-[100]"
                >
                    <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Fet">
                        <Bold size={15} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Kursiv">
                        <Italic size={15} />
                    </ToolBtn>

                    <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Rubrik 1">
                        <Heading1 size={15} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Rubrik 2">
                        <Heading2 size={15} />
                    </ToolBtn>

                    <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                    <ToolBtn onClick={setLink} isActive={editor.isActive('link')} title="Länk">
                        <LinkIcon size={15} />
                    </ToolBtn>
                    {editor.isActive('link') && (
                        <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Ta bort länk">
                            <Unlink size={15} />
                        </ToolBtn>
                    )}

                    <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

                    <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citat">
                        <Quote size={15} />
                    </ToolBtn>
                </BubbleMenu>
            )}

            {/* Floating Menu (empty line — "+" button) */}
            {editor && (
                <FloatingMenu
                    editor={editor}
                    tippyOptions={{
                        duration: 150,
                        placement: 'left-start',
                        offset: [0, 8],
                    }}
                    className="z-50"
                >
                    <div className="flex items-center gap-1">
                        {/* Plus toggle */}
                        <button
                            onClick={() => setIsFloatingExpanded(!isFloatingExpanded)}
                            className={`w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-all hover:border-white/40 hover:bg-white/5 ${isFloatingExpanded ? 'rotate-45 bg-white/10 border-white/30' : ''}`}
                        >
                            <Plus size={18} className="text-white/40" />
                        </button>

                        {/* Expanded options */}
                        {isFloatingExpanded && (
                            <div className="flex items-center gap-1 bg-[#111] border border-white/15 shadow-2xl rounded-xl p-1 ml-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                <ToolBtn onClick={() => { addImage(); setIsFloatingExpanded(false); }} title="Bild">
                                    <ImageIcon size={16} />
                                </ToolBtn>
                                <ToolBtn onClick={() => { addYoutubeVideo(); setIsFloatingExpanded(false); }} title="YouTube">
                                    <Play size={16} />
                                </ToolBtn>
                                <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
                                <ToolBtn onClick={addDivider} title="Avdelare">
                                    <Minus size={16} />
                                </ToolBtn>
                                <ToolBtn onClick={() => { editor.chain().focus().toggleBlockquote().run(); setIsFloatingExpanded(false); }} title="Citat">
                                    <Quote size={16} />
                                </ToolBtn>
                                <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
                                <ToolBtn onClick={() => { editor.chain().focus().toggleBulletList().run(); setIsFloatingExpanded(false); }} title="Punktlista">
                                    <List size={16} />
                                </ToolBtn>
                                <ToolBtn onClick={() => { editor.chain().focus().toggleOrderedList().run(); setIsFloatingExpanded(false); }} title="Numrerad lista">
                                    <ListOrdered size={16} />
                                </ToolBtn>
                            </div>
                        )}
                    </div>
                </FloatingMenu>
            )}

            <EditorContent editor={editor} />

            <MediaModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onInsert={handleMediaInsert}
                initialTab={mediaModalType}
            />
        </div>
    );
};

export default RichTextEditor;
