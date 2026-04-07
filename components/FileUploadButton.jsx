"use client";

import React, { useRef, useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, AlertCircle } from 'lucide-react';

const FileUploadButton = ({ onUploadSuccess, accept = "image/*", label = "Ladda Upp", variant = "default" }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const generateFileUrl = useMutation(api.files.generateFileUrl);

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // 1. Get an upload URL from Convex
            const postUrl = await generateUploadUrl();

            // 2. POST the file securely to the URL
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            // 3. Construct public URL using Convex mutation
            const publicUrl = await generateFileUrl({ storageId });

            if (!publicUrl) throw new Error("Could not retrieve file URL");

            onUploadSuccess(publicUrl, file);
        } catch (err) {
            console.error("Upload error:", err);
            setError("Kunde inte ladda upp filen. Försök igen.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isIconOnly = variant === "icon";

    return (
        <div className="relative inline-flex flex-col">
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={isIconOnly
                    ? "text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "absolute right-2 top-1/2 -translate-y-1/2 bg-[#50c878] text-[#1a1818] p-1.5 rounded-lg hover:scale-105 transition-all disabled:opacity-50"}
                title="Ladda upp fil"
            >
                {isUploading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Upload size={14} />
                        {isIconOnly && <span>{label}</span>}
                    </>
                )}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept={accept}
            />
            {error && <span className="absolute -top-8 right-0 text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded whitespace-nowrap"><AlertCircle size={10} className="inline mr-1" />{error}</span>}
        </div>
    );
};

export default FileUploadButton;
