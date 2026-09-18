"use client";
import { useEffect } from "react";

export default function UploadOnlyModal({ isOpen, onClose, children, maxWidth = 'max-w-4xl', maxHeight = 'max-h-3xl', requestLoading, theme }) {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0  flex items-center justify-center bg-black/50 z-[9999]"
        >
            <div
                className={`rounded-2xl shadow-lg p-6 ${maxWidth} ${maxHeight} w-full relative border`}
                style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb", color: textPri || "#1f2937" }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
                <button
                    onClick={onClose}
                    disabled={requestLoading}
                    className="disabled:opacity-50 absolute top-3 cursor-pointer right-3 rounded p-1 transition"
                    style={{ color: textSec || "#6b7280", backgroundColor: "transparent" }}
                    onMouseEnter={(e) => {
                        if (hover) e.currentTarget.style.backgroundColor = hover;
                        if (textPri) e.currentTarget.style.color = textPri;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = textSec || "#6b7280";
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
