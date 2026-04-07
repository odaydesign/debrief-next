"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const CustomModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Bekräfta",
    cancelText = "Avbryt",
    type = "danger" // "danger", "success", "info"
}) => {

    const icons = {
        danger: <AlertTriangle className="text-red-500 w-6 h-6" />,
        success: <CheckCircle className="text-[#50c878] w-6 h-6" />,
        info: <Info className="text-white/70 w-6 h-6" />
    };

    const confirmButtonClasses = {
        danger: "bg-red-500 hover:bg-red-600 text-white",
        success: "bg-[#50c878] hover:bg-[#43a865] text-[#1a1818]",
        info: "bg-white/10 hover:bg-white/20 text-white"
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#2a2726]/80 backdrop-blur-sm"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-sm bg-[#1a1818] border border-white/10 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex items-start gap-4">
                                <div className={`shrink-0 p-3 rounded-2xl bg-white/5 border border-white/10`}>
                                    {icons[type]}
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-lg font-serif font-bold text-[#f6f4f1] mb-2">{title}</h3>
                                    <p className="text-sm font-sans text-white/60 leading-relaxed mb-6">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-2">
                                {onCancel && (
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold font-sans text-white/50 hover:text-white hover:bg-white/5 transition-colors tracking-wide"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold font-sans transition-colors tracking-wide ${confirmButtonClasses[type]}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>

                        {/* Top Right Close Button (Optional/Fail-safe) */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CustomModal;
