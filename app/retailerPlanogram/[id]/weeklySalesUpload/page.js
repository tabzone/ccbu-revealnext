"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { useTheme } from "@/app/components/ThemeProvider";
import { Toast } from "@/app/components/Toast";
import { apiGet } from "@/lib/api";
import {
  extractUploadRows,
  StatusBadge,
  SessionUploadModal,
} from "@/app/components/upload/SessionUpload";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const UPLOAD_TYPE_LABELS = { SALES: "Weekly Sales", MKT: "Market Report" };
const UPLOAD_TYPE_BADGE_COLORS = {
  SALES: { bg: "#dbeafe", color: "#1d4ed8" },
  MKT: { bg: "#ede9fe", color: "#7c3aed" },
};

const FILE_TYPES = [
  { value: "SALES", label: "Weekly Sales" },
  { value: "MKT", label: "Nielsen Market Data" },
];

function UploadTypeBadge({ filetype }) {
  const colors = UPLOAD_TYPE_BADGE_COLORS[filetype] ?? { bg: "#f3f4f6", color: "#6b7280" };
  const label = UPLOAD_TYPE_LABELS[filetype] ?? filetype ?? "-";
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: colors.bg, color: colors.color }}>
      {label}
    </span>
  );
}

export default function WeeklySalesUploadPage() {
  const params = useParams();
  const retailerId = params?.id;
  const { theme } = useTheme();

  const [selectedFileType, setSelectedFileType] = useState("");
  const [activeUploadType, setActiveUploadType] = useState(null);
  const [validating, setValidating] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchHistory = useCallback(() => {
    if (!retailerId) return;

    setHistoryLoading(true);
    apiGet(`/retailers/${retailerId}/uploads`)
      .then((res) => {
        const rows = extractUploadRows(res)
          .filter((row) => Object.keys(UPLOAD_TYPE_LABELS).includes(row.filetype ?? row.file_type))
          .sort((a, b) => new Date(b.created_at ?? b.uploaded_at ?? 0) - new Date(a.created_at ?? a.uploaded_at ?? 0));
        setHistory(rows);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [retailerId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleUploadClose = useCallback(() => {
    setActiveUploadType(null);
  }, []);

  const handleUploadError = useCallback((message) => {
    addToast(message, "error");
  }, [addToast]);

  const handleUploadSuccess = useCallback((message) => {
    addToast(message);
    fetchHistory();
    setActiveUploadType(null);
    setSelectedFileType("");
  }, [addToast, fetchHistory]);

  const handleValidateClick = useCallback(async () => {
    setValidating(true);
    try {
      // TODO: wire up the real validate endpoint once it's available.
      await Promise.resolve();
      addToast("Validated");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setValidating(false);
    }
  }, [addToast]);

  const today = new Date();
  const uploadDate = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekNumber = getISOWeek(today);

  const isDark = theme === "dark";
  const bg = isDark ? "#191919" : "#ffffff";
  const bgSub = isDark ? "#2a2a2a" : "#f9fafb";
  const bgDrop = isDark ? "#242424" : "#ffffff";
  const border = isDark ? "#333333" : "#e5e7eb";
  const textPri = isDark ? "#e5e7eb" : "#1f2937";
  const textSec = isDark ? "#9ca3af" : "#6b7280";
  const hover = isDark ? "#333333" : "#f3f4f6";
  const accent = isDark ? "#f87171" : "#dc2626";

  const uploadModalConfig = {
    SALES: { filename: "retailerSales.xlsx", title: "Upload Weekly Sales" },
    MKT: { filename: "retailerMarket.xlsx", title: "Upload Nielsen Market Data" },
  }[activeUploadType];

  return (
    <AppLayout>
      <div className="mx-auto">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 style={{ color: textPri }} className="text-3xl font-bold mb-2">
            Data Upload
          </h1>
          <p style={{ color: textSec }} className="text-base">
            Upload your datasets to sync with the latest information
          </p>
        </div>

        {/* CONTROLS CARD */}
        <div style={{ backgroundColor: bg, borderColor: border }} className="rounded-2xl border p-6 mb-6">

          {/* Upload Date and Week labels */}
          <div className="flex items-center gap-8 mb-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
            <div>
              <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                Fiscal Date
              </p>
              <p style={{ color: textPri }} className="text-sm font-bold">{uploadDate}</p>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: border }} />
            <div>
              <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                Week
              </p>
              <p style={{ color: textPri }} className="text-sm font-bold">Week {weekNumber}</p>
            </div>
          </div>

          {/* File type dropdown + Upload button */}
          <div>
            <label style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold block mb-2">
              File Type
            </label>
            <div className="flex gap-3">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                style={{
                  backgroundColor: bgSub,
                  borderColor: border,
                  color: selectedFileType ? textPri : textSec,
                }}
                className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none appearance-none cursor-pointer transition"
                onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = border)}
              >
                <option value="" disabled>Select file type...</option>
                {FILE_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value} style={{ color: textPri, backgroundColor: bgDrop }}>
                    {ft.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => selectedFileType && setActiveUploadType(selectedFileType)}
                disabled={!selectedFileType}
                style={{
                  backgroundColor: selectedFileType ? accent : (isDark ? "#333" : "#e5e7eb"),
                  color: selectedFileType ? "#fff" : textSec,
                }}
                className="flex items-center cursor-pointer gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload File
              </button>

              <button
                onClick={handleValidateClick}
                disabled={!selectedFileType || validating}
                style={{
                  backgroundColor: selectedFileType ? accent : (isDark ? "#333" : "#e5e7eb"),
                  color: selectedFileType ? "#fff" : textSec,
                }}
                className="flex items-center cursor-pointer gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                {validating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {validating ? "Validating..." : "Validate"}
              </button>
            </div>
          </div>
        </div>

        {/* UPLOAD HISTORY */}
        <div style={{ backgroundColor: bg, borderColor: border }} className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: border }}>
            <h2 className="text-base font-semibold" style={{ color: textPri }}>Upload History</h2>
            <button onClick={fetchHistory} className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80" style={{ borderColor: border, color: textSec }}>
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: bgSub, borderColor: border }} className="border-b">
                  {["Type", "File Name", "Uploaded At", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{ color: textPri }}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={4} style={{ color: textSec }} className="px-6 py-10 text-center text-sm">Loading...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ color: textSec }} className="px-6 py-10 text-center text-sm">No uploads yet.</td>
                  </tr>
                ) : (
                  history.map((row, i) => {
                    const filetype = row.filetype ?? row.file_type;
                    return (
                      <tr
                        key={row.requestid ?? row.id ?? i}
                        style={{ borderColor: border }}
                        className="border-t transition"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="px-6 py-4"><UploadTypeBadge filetype={filetype} /></td>
                        <td style={{ color: textPri }} className="px-6 py-4 font-semibold">{row.file_name ?? row.filename ?? "-"}</td>
                        <td style={{ color: textSec }} className="px-6 py-4">
                          {row.created_at || row.uploaded_at ? new Date(row.created_at ?? row.uploaded_at).toLocaleString() : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {activeUploadType && (
        <SessionUploadModal
          retailerId={retailerId}
          filetype={activeUploadType}
          filename={uploadModalConfig.filename}
          title={uploadModalConfig.title}
          week={String(weekNumber)}
          fiscalDate={today.toISOString().slice(0, 10)}
          theme={{ bg, bgSub, border, textPri, textSec, accent }}
          onClose={handleUploadClose}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          fetchHistory={fetchHistory}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}
