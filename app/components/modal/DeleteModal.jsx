"use client";

import { apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function DeleteModal({ store, onClose, onDeleted, theme }) {
  const { bg, border, textPri, textSec, accent } = theme;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await apiDelete(`/stores/${store.store}`);
      onDeleted(store.store);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: bg,
          borderColor: border,
        }}
        className="w-[380px] max-w-full overflow-hidden rounded-xl border shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b px-6 py-5" style={{ borderColor: border }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-5 w-5 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>

          <div>
            <h2 className="font-semibold text-lg" style={{ color: textPri }}>
              Delete Store
            </h2>
            <p className="text-sm" style={{ color: textSec }}>
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <p style={{ color: textPri }}>
            Are you sure you want to delete{" "}
            <span className="font-semibold">Store #{store.store}</span>?
          </p>

          <div
            className="mt-4 rounded-lg border p-3 text-sm"
            style={{ borderColor: border }}
          >
            <p style={{ color: textPri }}>
              {store.store_leader || "No leader"}
            </p>
            <p style={{ color: textSec }}>
              {[store.city, store.state].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        <div
          className="flex justify-end gap-3 border-t px-6 py-4"
          style={{ borderColor: border }}
        >
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-neutral-800"
            style={{
              borderColor: border,
              color: textSec,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex min-w-[100px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {deleting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(modal, document.body);
}
