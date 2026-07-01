"use client";

import { createPortal } from "react-dom";
import Uppy from "@uppy/core";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { url } from "@/data/constants";
import UppyDash from "./uppy/Uppydash";

// ─── Status / type badges ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  success:    { bg: "#dcfce7", color: "#15803d", label: "Success" },
  failed:     { bg: "#fee2e2", color: "#dc2626", label: "Failed" },
  processing: { bg: "#fef9c3", color: "#b45309", label: "Processing" },
  pending:    { bg: "#f3f4f6", color: "#6b7280", label: "Pending" },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

const TYPE_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef9c3", color: "#b45309" },
];

function TypeBadge({ label, index = 0 }) {
  const c = TYPE_COLORS[index % TYPE_COLORS.length];
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: c.bg, color: c.color }}>
      {label}
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ─── Upload modal (per card) ──────────────────────────────────────────────────

function UploadModal({ card, theme, onClose, onSuccess }) {
  const { bg, border, textPri, textSec, accent } = theme;
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);

  const uppy = useMemo(
    () =>
      new Uppy({
        restrictions: { maxNumberOfFiles: 1, allowedFileTypes: [".csv", ".xlsx", ".xls"] },
        autoProceed: false,
      }),
    []
  );

  useEffect(() => () => uppy.destroy(), [uppy]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleUpload = async () => {
    const files = uppy.getFiles();
    if (!files.length) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", files[0].data, files[0].name);

    try {
      const res = await fetch(url(card.uploadPath), { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? err.message ?? `Upload failed (${res.status})`);
      }
      const result = await res.json();
      onSuccess(result?.message ?? "File uploaded successfully");
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: bg, borderColor: border }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: border }}>
          <h2 className="text-xl font-semibold" style={{ color: textPri }}>{card.title}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none hover:opacity-60 transition" style={{ color: textSec }} aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="p-6">
          <UppyDash uppy={uppy} />
          {error && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: border }}>
          <button type="button" onClick={onClose} className="rounded-lg border px-5 py-2 text-sm font-medium transition hover:opacity-80" style={{ borderColor: border, color: textSec }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            style={{ backgroundColor: accent }}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
          >
            {uploading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── History table ────────────────────────────────────────────────────────────

const HISTORY_COLS = ["Type", "File Name", "Uploaded At", "Status", "Total Rows", "Failed Rows"];

// ─── Main generic component ───────────────────────────────────────────────────

/**
 * cards: Array<{
 *   key: string,
 *   title: string,           // used as modal title too
 *   description: string,
 *   uploadPath: string,      // POST endpoint, e.g. "/stores/upload"
 *   downloadPath: string,    // GET template endpoint
 *   downloadLabel: string,
 *   historyPath: string,     // GET upload history endpoint
 *   Icon: React component receiving { color }
 * }>
 */
export function UploadTab({ cards, theme, addToast }) {
  const { bg, bgSub, border, textPri, textSec, accent, hover } = theme;

  const [activeCard, setActiveCard]         = useState(null);
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const cardByKey = Object.fromEntries(cards.map((c) => [c.key, c]));

  const fetchHistory = () => {
    setHistoryLoading(true);
    Promise.all(
      cards.map((card, idx) =>
        apiGet(card.historyPath)
          .then((d) => (d?.data ?? []).map((r) => ({ ...r, _type: card.key, _typeLabel: card.title, _typeIdx: idx })))
          .catch(() => [])
      )
    )
      .then((results) => {
        const combined = results
          .flat()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistory(combined);
      })
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleUploadSuccess = (message) => {
    setActiveCard(null);
    addToast?.(message);
    fetchHistory();
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      {/* Download templates row */}
      <div
        className="flex items-center gap-3 flex-shrink-0 rounded-xl border px-5 py-3.5"
        style={{ backgroundColor: bgSub, borderColor: border }}
      >
        <span className="text-sm font-medium mr-1 flex-shrink-0" style={{ color: textSec }}>
          Download Templates:
        </span>
        {cards.map((card) => (
          <a
            key={card.key}
            href={url(card.downloadPath)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition hover:opacity-80"
            style={{ borderColor: border, color: textPri, backgroundColor: bg }}
          >
            <DownloadIcon />
            {card.downloadLabel}
          </a>
        ))}
      </div>

      {/* Upload cards */}
      <div className={`grid gap-4 flex-shrink-0 ${cards.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 sm:grid-cols-2"}`}>
        {cards.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border p-6 flex flex-col gap-5"
            style={{ backgroundColor: bg, borderColor: border }}
          >
            <div className="flex items-start gap-4">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accent}1a` }}
              >
                <card.Icon color={accent} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base" style={{ color: textPri }}>{card.title}</h3>
                <p className="text-sm mt-1" style={{ color: textSec }}>{card.description}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveCard(card.key)}
                style={{ backgroundColor: accent }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
              >
                <UploadIcon />
                Upload
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload history */}
      <div
        className="flex-1 flex flex-col min-h-0 rounded-xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: border }}>
          <h2 className="text-base font-semibold" style={{ color: textPri }}>Upload History</h2>
          <button onClick={fetchHistory} className="text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80" style={{ borderColor: border, color: textSec }}>
            Refresh
          </button>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                {HISTORY_COLS.map((col) => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: bgSub, color: textSec }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={HISTORY_COLS.length} className="py-14 text-center text-sm" style={{ color: textSec }}>Loading…</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={HISTORY_COLS.length} className="py-14 text-center text-sm" style={{ color: textSec }}>No uploads yet.</td>
                </tr>
              ) : (
                history.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className="border-b transition"
                    style={{ borderColor: border }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                  >
                    <td className="px-5 py-3">
                      <TypeBadge label={row._typeLabel} index={row._typeIdx} />
                    </td>
                    <td className="px-5 py-3 font-medium max-w-[220px] truncate" style={{ color: textPri }} title={row.file_name ?? row.filename}>
                      {row.file_name ?? row.filename ?? "—"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-5 py-3" style={{ color: textPri }}>{row.total_rows ?? row.records ?? "—"}</td>
                    <td className="px-5 py-3" style={{ color: (row.failed_rows ?? 0) > 0 ? "#dc2626" : textSec }}>
                      {row.failed_rows ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload modal */}
      {activeCard && (
        <UploadModal
          card={cardByKey[activeCard]}
          theme={theme}
          onClose={() => setActiveCard(null)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
