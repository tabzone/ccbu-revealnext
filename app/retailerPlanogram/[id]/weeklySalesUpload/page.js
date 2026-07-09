"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import useAppTheme from "@/app/hooks/useAppTheme";
import { Toast } from "@/app/components/Toast";
import { apiGet } from "@/lib/api";
import {
  extractUploadRows,
  getUploadFilename,
  StatusBadge,
  SessionUploadModal,
} from "@/app/components/upload/SessionUpload";
import { ValidationModal, extractValidationRows } from "@/app/components/modal/ValidationModal";
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

const PAGE_TABS = [
  { key: "history", label: "Upload History" },
  { key: "validationHistory", label: "Validation History" },
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

// NEW: small ready/pending status pill for Sales & Market data
function ReadyBadge({ label, ready, isDark }) {
  const bg = ready ? (isDark ? "#14532d" : "#dcfce7") : (isDark ? "#3a3a3a" : "#f3f4f6");
  const color = ready ? (isDark ? "#4ade80" : "#15803d") : (isDark ? "#9ca3af" : "#6b7280");
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: bg }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: ready ? (isDark ? "#4ade80" : "#16a34a") : (isDark ? "#6b7280" : "#9ca3af") }}
      />
      <span className="text-xs font-semibold" style={{ color }}>
        {label} {ready ? "Uploaded" : "Pending"}
      </span>
    </div>
  );
}

function Skeleton({ width = "60px", height = "14px", isDark }) {
  return (
    <span
      className="inline-block rounded animate-pulse"
      style={{
        width,
        height,
        backgroundColor: isDark ? "#3a3a3a" : "#e5e7eb",
      }}
    />
  );
}



function UploadTypeBadgeExport() { } // (unused placeholder removed if not needed)

export default function WeeklySalesUploadPage() {
  const params = useParams();
  const retailerId = params?.id;
  const { isDark, bg, bgSub, bgDrop, border, textPri, textSec, hover, accent } = useAppTheme();

  const [activeTab, setActiveTab] = useState("history");
  const [selectedFileType, setSelectedFileType] = useState("");
  const [activeUploadType, setActiveUploadType] = useState(null);
  const [validateOpen, setValidateOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState("SALES");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [unpublishedWeek, setUnpublishedWeek] = useState(null);
  const [unpublishedWeekLoading, setUnpublishedWeekLoading] = useState(true);
  const [validationHistory, setValidationHistory] = useState([]);
  const [validationHistoryLoading, setValidationHistoryLoading] = useState(false);
  const [validationHistoryError, setValidationHistoryError] = useState(null);
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

  const fetchValidationHistory = useCallback(() => {
    if (!retailerId) return;

    setValidationHistoryLoading(true);
    setValidationHistoryError(null);
    apiGet(`/retailers/${retailerId}/validate`)
      .then((res) => setValidationHistory(extractValidationRows(res)))
      .catch((err) => setValidationHistoryError(err.message))
      .finally(() => setValidationHistoryLoading(false));
  }, [retailerId]);

  const handlePageTabClick = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === "validationHistory") fetchValidationHistory();
  }, [fetchValidationHistory]);

  const handleUploadClose = useCallback(() => {
    setActiveUploadType(null);
  }, []);

  const handleUploadError = useCallback((message) => {
    addToast(message, "error");
  }, [addToast]);

  const handleUploadSuccess = useCallback((message) => {
    addToast(message);
    fetchHistory();
    fetchUnpublishedWeek(); // NEW: refresh sales_ready/market_ready after a successful upload
    setSelectedFileType("");
  }, [addToast, fetchHistory, fetchUnpublishedWeek]);

  const handleValidateClick = useCallback(() => {
    setValidateOpen(true);
  }, []);

  const handleValidateClose = useCallback(() => {
    setValidateOpen(false);
  }, []);

  const today = new Date();
  const weekNumber = getISOWeek(today);

  const dataWeekValue = unpublishedWeekLoading ? "-" : (unpublishedWeek?.dataweek ?? "-");
  const fiscalWeekValue = unpublishedWeekLoading ? "-" : (unpublishedWeek?.fiscal_week ?? "-");
  const salesReady = !!unpublishedWeek?.sales_ready;
  const marketReady = !!unpublishedWeek?.market_ready;
  const canValidate = salesReady && marketReady;

  const uploadModalConfig = {
    SALES: { filename: "retailerSales.xlsx", title: "Upload Weekly Sales" },
    MKT: { filename: "retailerMarket.xlsx", title: "Upload Nielsen Market Data" },
  }[activeUploadType];

  return (
    <AppLayout>
      <div className="h-full flex flex-col gap-4">

        {/* CONTROLS + PUBLISH ROW — always visible now */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* CONTROLS CARD */}
          <div style={{ backgroundColor: bg, borderColor: border }} className="lg:basis-1/2 lg:max-w-1/2 p-4">

            {/* Upload Date and Week labels */}
            <div className="flex items-center gap-8 mb-4" style={{ borderBottom: `1px solid ${border}`, paddingBottom: "1rem" }}>
              <div>
                <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                  Data Week
                </p>
                {unpublishedWeekLoading ? (
                  <Skeleton width="70px" height="16px" isDark={isDark} />
                ) : (
                  <p style={{ color: textPri }} className="text-sm font-bold">{dataWeekValue}</p>
                )}
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: border }} />
              <div>
                <p style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold mb-1">
                  Fiscal Week
                </p>
                {unpublishedWeekLoading ? (
                  <Skeleton width="70px" height="16px" isDark={isDark} />
                ) : (
                  <p style={{ color: textPri }} className="text-sm font-bold">{fiscalWeekValue}</p>
                )}
              </div>
            </div>

            {/* NEW: Upload readiness status pills */}
            <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
              {unpublishedWeekLoading ? (
                <>
                  <Skeleton width="140px" height="30px" isDark={isDark} />
                  <Skeleton width="140px" height="30px" isDark={isDark} />
                </>
              ) : (
                <>
                  <ReadyBadge label="Weekly Sales" ready={salesReady} isDark={isDark} />
                  <ReadyBadge label="Market Data" ready={marketReady} isDark={isDark} />
                </>
              )}
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
                  disabled={!canValidate}
                  style={{
                    backgroundColor: validateOpen ? (isDark ? "#333" : "#e5e7eb") : accent,
                    color: validateOpen ? textSec : "#fff",
                  }}
                  className="flex items-center cursor-pointer gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 whitespace-nowrap"
                  title={!canValidate ? "Upload both Weekly Sales and Market Data first" : undefined}
                >
                  {validateOpen ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {validateOpen ? "Validating..." : "Validate"}
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
                {unpublishedWeekLoading ? (
                  <Skeleton width="90px" height="16px" isDark={isDark} />
                ) : (
                  <p style={{ color: textPri }} className="text-sm font-bold">
                    {unpublishedWeek?.published === true
                      ? "Published"
                      : unpublishedWeek?.published === false
                        ? "Not Published"
                        : "-"}
                  </p>
                )}
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

        {/* TOP-LEVEL TABS — now just Upload History / Validation History */}
        <div className="flex border-b " style={{ borderColor: border }}>
          {PAGE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handlePageTabClick(tab.key)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px cursor-pointer"
              style={{
                color: activeTab === tab.key ? accent : textSec,
                borderBottomColor: activeTab === tab.key ? accent : "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}

        </div>

        {activeTab === "history" && (
          <div style={{ backgroundColor: bg, borderColor: border }} className="flex-1 min-h-0 flex flex-col rounded-xl border shadow-sm overflow-hidden">


            <div className="px-5 pt-3 flex justify-between border-b flex-shrink-0" style={{ borderColor: border }}>
              <div>  {HISTORY_TABS.map((tab) => (
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
              <div className="px-5 py-2 border-b flex items-center justify-end flex-shrink-0" style={{ borderColor: border }}>
                <button onClick={fetchHistory} className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80" style={{ borderColor: border, color: textSec }}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: bgSub, borderColor: border }} className="border-b">
                    {["Type", "File Name", "Uploaded At", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{ color: textPri, backgroundColor: bgSub }}
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
        )}

        {activeTab === "validationHistory" && (
          <div style={{ backgroundColor: bg, borderColor: border }} className="flex-1 min-h-0 flex flex-col rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-end flex-shrink-0" style={{ borderColor: border }}>
              <button onClick={fetchValidationHistory} className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80" style={{ borderColor: border, color: textSec }}>
                Refresh
              </button>
            </div>

            {validationHistoryError ? (
              <div className="p-5 text-sm text-red-600">{validationHistoryError}</div>
            ) : (
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr
                      style={{ backgroundColor: bgSub, borderColor: border }}
                      className="border-b"
                    >
                      {["Updated At", "Result", "Status", "Report"].map((h) => (
                        <th
                          key={h}
                          style={{ color: textPri, backgroundColor: bgSub }}
                          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validationHistoryLoading ? (
                      <tr>
                        <td colSpan={6} style={{ color: textSec }} className="px-6 py-10 text-center text-sm">Loading...</td>
                      </tr>
                    ) : validationHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ color: textSec }} className="px-6 py-10 text-center text-sm">No validation history yet.</td>
                      </tr>
                    ) : (
                      validationHistory.map((row, i) => (
                        <tr
                          key={row.reqid ?? i}
                          style={{ borderColor: border }}
                          className="border-t transition"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <td
                            style={{ color: textSec }}
                            className="px-6 py-4 whitespace-nowrap"
                          >
                            {row.updated_at
                              ? new Date(row.updated_at).toLocaleString()
                              : "-"}
                          </td>
                          <td
                            style={{ color: textPri }}
                            className="px-6 py-4 max-w-[240px] truncate"
                            title={row.result || row.error || ""}
                          >
                            {row.result ?? "-"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={row.status} />
                          </td>





                          <td className="px-6 py-4">
                            {row.presigned_url ? (
                              <a
                                href={row.presigned_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                                style={{
                                  border: `1px solid ${border}`,
                                  color: textPri,
                                  backgroundColor: bgSub,
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                              </a>
                            ) : (
                              <span style={{ color: textSec }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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

      {validateOpen && (
        <ValidationModal
          retailerId={retailerId}
          theme={{ bg, bgSub, border, textPri, textSec, accent }}
          onClose={handleValidateClose}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}