"use client";
import { useEffect } from "react";

export default function UploadOnlyModal({ isOpen, onClose, children, maxWidth = 'max-w-4xl', maxHeight = 'max-h-3xl', requestLoading }) {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0  flex items-center justify-center bg-black/50 z-[9999]">
            <div className={`bg-white rounded-2xl shadow-lg p-6 ${maxWidth} ${maxHeight} w-full relative`}>
                {children}
                <button
                    onClick={onClose}
                    disabled={requestLoading}
                    className="disabled:opacity-50 absolute top-3 cursor-pointer right-3 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
