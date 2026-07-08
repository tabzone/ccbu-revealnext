"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { useTheme } from "@/app/components/ThemeProvider";
import { Toast } from "@/app/components/Toast";
import { apiGet } from "@/lib/api";
import {
  extractUploadRows,
  getUploadFilename,
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

const HISTORY_TABS = [
  { key: "SALES", label: "Weekly Sales History" },
  { key: "MKT", label: "Nielsen Market Data History" },
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
  const [historyTab, setHistoryTab] = useState("SALES");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [unpublishedWeek, setUnpublishedWeek] = useState(null);
  const [unpublishedWeekLoading, setUnpublishedWeekLoading] = useState(true);
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
    apiGet(`/retailers/${retailerId}/uploads/${historyTab}`)
      .then((res) => {
        const rows = extractUploadRows(res)
          .filter((row) => (row.filetype ?? row.file_type) === historyTab)
          .sort((a, b) => new Date(b.created_at ?? b.uploaded_at ?? 0) - new Date(a.created_at ?? a.uploaded_at ?? 0));
        setHistory(rows);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [retailerId, historyTab]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const fetchUnpublishedWeek = useCallback(() => {
    if (!retailerId) return;

    setUnpublishedWeekLoading(true);
    apiGet(`/retailers/${retailerId}/weeks/unpublished`)
      .then((res) => {
        const payload = res?.data ?? res;
        setUnpublishedWeek(payload && Object.keys(payload).length > 0 ? payload : null);
      })
      .catch(() => setUnpublishedWeek(null))
      .finally(() => setUnpublishedWeekLoading(false));
  }, [retailerId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUnpublishedWeek(); }, [fetchUnpublishedWeek]);

  const handleUploadClose = useCallback(() => {
    setActiveUploadType(null);
  }, []);

  const handleUploadError = useCallback((message) => {
    addToast(message, "error");
  }, [addToast]);

  const handleUploadSuccess = useCallback((message) => {
    addToast(message);
    fetchHistory();
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
  const weekNumber = getISOWeek(today);

  const dataWeekValue = unpublishedWeekLoading ? "-" : (unpublishedWeek?.dataweek ?? "-");
  const fiscalWeekValue = unpublishedWeekLoading ? "-" : (unpublishedWeek?.fiscal_week ?? "-");

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
        {/* <div className="mb-8">
          <h1 style={{ color: textPri }} className="text-3xl font-bold mb-2">
            Data Upload
          </h1>
          <p style={{ color: textSec }} className="text-base">
            Upload your datasets to sync with the latest information
          </p>
        </div> */}

        {/* CONTROLS + PUBLISH ROW */}
       <div className="flex flex-col lg:flex-row gap-4 mb-6">

          {/* CONTROLS CARD */}
          <div style={{ backgroundColor: bg, borderColor: border }} className="lg:basis-1/2 lg:max-w-1/2 p-4">

            {/* Upload Date and Week labels */}
            <div className="flex items-center gap-8 mb-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                  Data Week
                </p>
                <p style={{ color: textPri }} className="text-sm font-bold">{dataWeekValue}</p>
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: border }} />
              <div>
                <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                  Fiscal Week
                </p>
                <p style={{ color: textPri }} className="text-sm font-bold">{fiscalWeekValue}</p>
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
                  // onClick={""}
                  disabled={true}
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

          {/* PUBLISH CARD */}
          <div style={{ backgroundColor: bg, borderColor: border }} className="lg:basis-1/2 lg:max-w-1/2 p-4">
            <h2 style={{ color: textPri }} className="text-base font-semibold mb-1">Publish</h2>
            <p style={{ color: textSec }} className="text-sm mb-6">
              Publish the current fiscal week once all data is ready.
            </p>

            <div className="flex items-center gap-8 mb-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                  Status
                </p>
                <p style={{ color: textPri }} className="text-sm font-bold">
                  {unpublishedWeekLoading
                    ? "-"
                    : unpublishedWeek?.published === true
                      ? "Published"
                      : unpublishedWeek?.published === false
                        ? "Not Published"
                        : "-"}
                </p>
              </div>
            </div>

            <button
              disabled={true}
              style={{
                backgroundColor: isDark ? "#333" : "#e5e7eb",
                color: textSec,
              }}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 mt-auto"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 12l6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Publish
            </button>
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

          <div className="px-5 pt-3 flex border-b flex-shrink-0" style={{ borderColor: border }}>
            {HISTORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setHistoryTab(tab.key)}
                className="px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px cursor-pointer"
                style={{
                  color: historyTab === tab.key ? accent : textSec,
                  borderBottomColor: historyTab === tab.key ? accent : "transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
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
                        <td style={{ color: textPri }} className="px-6 py-4 font-semibold">{getUploadFilename(row)}</td>
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
