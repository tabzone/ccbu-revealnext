"use client";

import { useEffect } from "react";

export default function Modal({ isOpen, onClose, children, maxWidth = "max-w-md", maxHeight = "max-h-[90vh]" }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${maxWidth} ${maxHeight} overflow-auto m-4`}>
        {children}
      </div>
    </div>
  );
}
