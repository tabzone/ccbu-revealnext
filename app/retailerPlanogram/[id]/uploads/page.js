"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { useTheme } from "@/app/components/ThemeProvider";
import { useRef, useState } from "react";

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const FILE_TYPES = [
  { value: "master_product", label: "Master Product Data" },
  { value: "store_data", label: "Store Data" },
  { value: "weekly_sales", label: "Weekly Sales Data" },
  { value: "planogram_data", label: "Planogram Data" },
];

const HISTORY = [
  { dataset: "Master Product Data", file: "master_products.xlsx", user: "John Smith", status: "Completed", date: "2026-06-28" },
  { dataset: "Store Data", file: "store_data.xlsx", user: "John Smith", status: "Completed", date: "2026-06-28" },
  { dataset: "Weekly Sales Data", file: "weekly_sales.xlsx", user: "John Smith", status: "Pending", date: "-" },
  { dataset: "Planogram Data", file: "-", user: "-", status: "Pending", date: "-" },
];

export default function UploadsPage() {
  const { theme } = useTheme();
  const [selectedFileType, setSelectedFileType] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const inputRef = useRef(null);

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
  const accentBg = isDark ? "#3f1a1a" : "#fef2f2";

  const selectedLabel = FILE_TYPES.find((f) => f.value === selectedFileType)?.label ?? "";

  const handleFile = (file) => {
    if (file) {
      setUploadedFile(file);
      setValidationResult(null);
    }
  };

  const handleValidation = async () => {
    setValidating(true);
    // Simulate validation
    await new Promise(r => setTimeout(r, 2000));
    setValidating(false);
    setValidationResult({ success: true, message: `${uploadedFile?.name} validated successfully` });
  };

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
          {/* File type dropdown + Upload button */}
          <div>
            <label style={{ color: textSec }} className="text-xs uppercase tracking-widest font-semibold block mb-2">
              File Type
            </label>
            <div className="flex gap-3">
              <select
                value={selectedFileType}
                onChange={(e) => {
                  setSelectedFileType(e.target.value);
                  setUploadedFile(null);
                  setValidationResult(null);
                }}
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
                onClick={() => selectedFileType && inputRef.current?.click()}
                disabled={!selectedFileType}
                style={{
                  backgroundColor: selectedFileType ? accent : (isDark ? "#333" : "#e5e7eb"),
                  color: selectedFileType ? "#fff" : textSec,
                }}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload File
              </button>

              {/* {uploadedFile && ( */}
                <button
                  onClick={handleValidation}
                  disabled={validating}
                  style={{
                    backgroundColor: accent,
                    color: "#fff",
                  }}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
                >
                  {validating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Validate
                    </>
                  )}
                </button>
              {/* )} */}
            </div>
          </div>

          {validationResult && (
            <div style={{ backgroundColor: accentBg, borderColor: accent }} className="border rounded-xl p-4 mt-4">
              <p style={{ color: textPri }} className="text-sm font-semibold">
                ✓ {validationResult.message}
              </p>
            </div>
          )}
        </div>

        {/* DROP ZONE - shown after a file type is selected */}
        {selectedFileType && (
          <div style={{ backgroundColor: bg, borderColor: border }} className="rounded-2xl border p-8 mb-8">
            <input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            <div
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              style={{
                backgroundColor: dragging ? accentBg : bgSub,
                borderColor: dragging ? accent : border,
              }}
              className="rounded-2xl border-2 border-dashed p-16 text-center transition"
            >
              {uploadedFile ? (
                <>
                  <div className="text-5xl mb-4">✅</div>
                  <p style={{ color: textPri }} className="text-lg font-semibold">
                    {uploadedFile.name}
                  </p>
                  <p style={{ color: textSec }} className="mt-1 text-sm">
                    File selected successfully
                  </p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    style={{ backgroundColor: accent }}
                    className="mt-6 rounded-lg px-6 py-2.5 text-sm text-white font-semibold hover:opacity-90 transition"
                  >
                    Replace File
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-6">
                    <div
                      style={{ backgroundColor: accentBg }}
                      className="h-20 w-20 rounded-full flex items-center justify-center"
                    >
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={accent}
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  </div>
                  <p style={{ color: textPri }} className="text-lg font-bold">
                    Drag and Drop your file here
                  </p>
                  <p style={{ color: textSec }} className="text-sm mt-2">
                    Drop your{" "}
                    <span style={{ color: textPri }} className="font-medium">
                      {selectedLabel}
                    </span>{" "}
                    file or click browse
                  </p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    style={{ backgroundColor: accent }}
                    className="mt-6 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                  >
                    Browse Files
                  </button>
                  <p style={{ color: textSec }} className="mt-4 text-xs">
                    Supported formats: .xlsx and .xls
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* UPLOAD HISTORY */}
        <div style={{ backgroundColor: bg, borderColor: border }} className="p-4 rounded-2xl border overflow-hidden">
          <div style={{ borderColor: border }} className="border-b px-6 py-5">
            <h2 style={{ color: textPri }} className="text-lg font-bold">Upload History</h2>
            <p style={{ color: textSec }} className="text-sm mt-1">Your recently uploaded datasets</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: bgSub, borderColor: border }} className="border-b">
                  {["Dataset", "File Name", "Uploaded By", "Status", "Date"].map((h) => (
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
                {HISTORY.map((row) => (
                  <tr
                    key={row.dataset}
                    style={{ borderColor: border }}
                    className="border-t transition"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ color: textPri }} className="px-6 py-4 font-semibold">
                      {row.dataset}
                    </td>
                    <td style={{ color: textSec }} className="px-6 py-4">{row.file}</td>
                    <td style={{ color: textSec }} className="px-6 py-4">{row.user}</td>
                    <td className="px-6 py-4">
                      <span
                        style={{
                          backgroundColor:
                            row.status === "Completed"
                              ? isDark ? "#1a472a" : "#f0fdf4"
                              : isDark ? "#3f2a0b" : "#fffbeb",
                          color: row.status === "Completed" ? "#16A34A" : "#92400e",
                        }}
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ color: textSec }} className="px-6 py-4">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}