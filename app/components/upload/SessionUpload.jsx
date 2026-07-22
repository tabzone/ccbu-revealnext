"use client";

import { createPortal } from "react-dom";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.css";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

export function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SESSION_UPLOAD_POLL_INTERVAL_MS = 2000;
export const SESSION_UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;
export const SESSION_UPLOAD_FILE_TYPES = [".xlsx", ".xls", ".csv"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeUploadStatus(value) {
  const status = String(value ?? "").toLowerCase();
  if (["success", "succeeded", "completed", "complete"].includes(status)) return "success";
  if (["failed", "failure", "error"].includes(status)) return "failed";
  if (["preview"].includes(status)) return "preview";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  if (["processing"].includes(status)) return "processing";
  return "pending";
}

export function getUploadFilename(row) {
  if (normalizeUploadStatus(row?.status) === "cancelled") return "-";
  return row?.file_name ?? row?.filename ?? "-";
}

export function extractUploadRows(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.uploads)) return data.uploads;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.history)) return data.history;
  return [];
}

export function getPreviewColumns(rows) {
  const keys = new Set();
  rows.slice(0, 10).forEach((row) => {
    Object.keys(row ?? {}).forEach((key) => keys.add(key));
  });
  return [...keys].slice(0, 8);
}

export function StatusBadge({ status }) {
  const normalized = normalizeUploadStatus(status);
  const config = {
    success: { bg: "#dcfce7", color: "#15803d", label: "Complete" },
    failed: { bg: "#fee2e2", color: "#dc2626", label: "Failed" },
    preview: { bg: "#dbeafe", color: "#1d4ed8", label: "Preview" },
    cancelled: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
    processing: { bg: "#fef3c7", color: "#b45309", label: "Processing" },
    pending: { bg: "#fef9c3", color: "#b45309", label: "Pending" },
  }[normalized];

  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
}

function waitForUploadPoll(ms, timerRef, cancelledRef) {
  return new Promise((resolve, reject) => {
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (cancelledRef.current) {
        reject(new Error("Upload status polling was cancelled"));
      } else {
        resolve();
      }
    }, ms);
  });
}

function uploadFileToS3({ uppy, file, uploadUrl, s3Key, xhrRef }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      uppy.emit("upload-progress", file, {
        uploader: "s3-presigned-url",
        bytesUploaded: event.loaded,
        bytesTotal: event.total,
      });
    };

    xhr.onload = () => {
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        uppy.emit("upload-success", file, {
          status: xhr.status,
          uploadURL: s3Key ?? uploadUrl,
          body: null,
        });
        resolve();
        return;
      }

      reject(new Error(`S3 upload failed (${xhr.status})`));
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      reject(new Error("S3 upload failed"));
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      reject(new Error("S3 upload was cancelled"));
    };

    xhr.open("PUT", uploadUrl);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file.data);
  });
}

// ─── Preview modal ────────────────────────────────────────────────────────────

export function SessionPreviewModal({ retailerId, upload, theme, onClose, onConfirmed, onError, previewPath = "/uploadproducts", fetchHistory }) {
  const { bg, bgSub, border, textPri, textSec, accent, hover } = theme;
  const requestid = upload?.requestid ?? upload?.id;
  const canLoadPreview = Boolean(retailerId && requestid);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(canLoadPreview);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(canLoadPreview ? null : "Upload request id is missing");

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);


  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiPost(`${previewPath}/${retailerId}/${requestid}/preview`);
        if (!cancelled) setPreview(res?.data ?? res);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (canLoadPreview) fetchPreview();

    return () => {
      cancelled = true;
    };
  }, [canLoadPreview, requestid, retailerId, previewPath]);

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      const res = await apiPost(`${previewPath}/${retailerId}/${requestid}/confirm`);
      onConfirmed(res?.message ?? "Upload confirmed");
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = useCallback(async () => {
    if (requestid) {
      try {
        await apiPut(`/retailers/${retailerId}/uploads/${requestid}`, { status: "Cancelled", filename: getUploadFilename(upload) });
      } catch { }
    }
    onClose();
    fetchHistory?.();
  }, [retailerId, requestid, onClose, fetchHistory]);

  if (typeof document === "undefined") return null;

  const rows = Array.isArray(preview?.rows) ? preview.rows : [];
  const errors = Array.isArray(preview?.errors) ? preview.errors : [];
  const columns = getPreviewColumns(rows);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={handleCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: bg, borderColor: border }}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: textPri }}>Preview Upload</h2>
            <p className="mt-1 text-xs" style={{ color: textSec }}>{getUploadFilename(upload)}</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={confirming}
            className="text-2xl leading-none hover:opacity-60 transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: textSec }}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-transparent" style={{ borderTopColor: accent }} />
              <p className="text-sm font-medium" style={{ color: textSec }}>Loading preview...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["File Type", preview?.filetype],
                  ["Total Rows", preview?.total_rows],
                  ["Valid Rows", preview?.valid_rows],
                  ["Invalid Rows", preview?.invalid_rows],
                  ["Errors", errors.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border p-3" style={{ backgroundColor: bgSub, borderColor: border }}>
                    <div className="text-xs" style={{ color: textSec }}>{label}</div>
                    <div className="mt-1 text-lg font-semibold" style={{ color: textPri }}>{value ?? "-"}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold" style={{ color: textPri }}>Rows</h3>
                <div className="max-h-72 overflow-auto rounded-lg border" style={{ borderColor: border }}>
                  <table className="min-w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        {columns.length > 0 ? columns.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-semibold uppercase whitespace-nowrap" style={{ backgroundColor: bgSub, color: textSec }}>
                            {col}
                          </th>
                        )) : (
                          <th className="px-3 py-8 text-center font-normal" style={{ backgroundColor: bgSub, color: textSec }}>No rows to preview.</th>
                        )}
                      </tr>
                    </thead>
                    {columns.length > 0 && (
                      <tbody>
                        {rows.slice(0, 50).map((row, index) => (
                          <tr key={index} className="border-t" style={{ borderColor: border }}>
                            {columns.map((col) => (
                              <td key={col} className="max-w-[220px] truncate px-3 py-2" style={{ color: textPri }} title={String(row?.[col] ?? "")}>
                                {String(row?.[col] ?? "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>

              {errors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: textPri }}>Validation Errors</h3>
                  <div className="max-h-52 overflow-auto rounded-lg border" style={{ borderColor: border }}>
                    <table className="min-w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold uppercase" style={{ backgroundColor: bgSub, color: textSec }}>Row</th>
                          <th className="px-3 py-2 text-left font-semibold uppercase" style={{ backgroundColor: bgSub, color: textSec }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errors.map((item, index) => (
                          <tr key={index} className="border-t transition" style={{ borderColor: border }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                            <td className="px-3 py-2 align-top" style={{ color: textPri }}>{item?.row ?? "-"}</td>
                            <td className="whitespace-pre-wrap px-3 py-2 align-top" style={{ color: textPri }}>{item?.reason ?? JSON.stringify(item)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ borderColor: border }}>
          <button type="button" onClick={handleCancel} disabled={confirming} className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-50" style={{ borderColor: border, color: textPri }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || confirming || !preview}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {confirming ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────

const PROCESS_ON_PENDING_FILETYPES = ["SALES", "MKT", "POG"];
const FILENAME_UPDATE_FILETYPES = ["SALES", "MKT"];
const PREVIEW_STATUS_FILETYPES = ["PRD", "STR"];
const SESSION_UPLOAD_SUCCESS_MESSAGE =
  "Upload completed successfully. Your upload has started processing. You can monitor its progress and validate the uploaded data from the History table using the Preview action.";

export function SessionUploadModal({
  retailerId,
  filetype = "PRD",
  filename = "retailerProduct.xlsx",
  title = "Upload Products",
  week = "",
  fiscalDate = "",
  theme,
  onClose,
  onSuccess,
  onError,
  fetchHistory,
}) {
  const { bg, border, textPri, textSec, accent } = theme;
  const [phase, setPhase] = useState("preparing");
  const [session, setSession] = useState(null);
  const [uppy, setUppy] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const pollTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const xhrRef = useRef(null);

  const canClose = phase === "ready" || phase === "polling" || phase === "error" || phase === "success";

  const closeModal = useCallback(async () => {
    if (!canClose) return;
    if (phase === "ready" && session?.requestid) {
      try {
        await apiPut(`/retailers/${retailerId}/uploads/${session.requestid}`, { status: "Cancelled" });
      } catch { }
    }
    onClose();
    fetchHistory();
  }, [canClose, onClose, phase, session, retailerId, fetchHistory]);



  const pollUploadStatus = useCallback(async (requestid) => {
    const startedAt = Date.now();

    while (!cancelledRef.current && Date.now() - startedAt < SESSION_UPLOAD_TIMEOUT_MS) {
      const res = await apiGet(`/retailers/${retailerId}/uploads/${requestid}`);
      const payload = res?.data ?? res;
      const status = normalizeUploadStatus(payload?.status);

      if (status === "success") {
        return payload?.message ?? "File uploaded successfully";
      }

      if (status === "preview") {
        return payload?.message ?? "File processed. Ready for preview.";
      }

      if (status === "failed") {
        throw new Error(payload?.message ?? payload?.detail ?? "Upload processing failed");
      }

      if (status === "pending") {
        await apiPut(`/retailers/${retailerId}/uploads/${requestid}`, { status: "Preview" });
        return payload?.message ?? "File uploaded. Ready for preview.";
      }

      await waitForUploadPoll(SESSION_UPLOAD_POLL_INTERVAL_MS, pollTimerRef, cancelledRef);
    }

    throw new Error("Upload status timed out after 2 minutes");
  }, [retailerId]);



  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  

  useEffect(() => {
    cancelledRef.current = false;

    const requestUploadSession = async () => {
      try {
        const res = await apiPost(`/retailers/${retailerId}/uploads`, {
          filetype,
          filename,
          week,
          fiscal_date: fiscalDate,
        });
        if (cancelledRef.current) return;

        const payload = res?.data ?? res;
        const uploadSession = {
          upload_url: payload?.upload_url,
          requestid: payload?.requestid,
          filename: payload?.filename,
          s3_key: payload?.s3_key,
        };

        if (!uploadSession.upload_url || !uploadSession.requestid) {
          throw new Error("Upload session response is missing required data");
        }

        const nextUppy = new Uppy({
          restrictions: {
            maxNumberOfFiles: 1,
            allowedFileTypes: SESSION_UPLOAD_FILE_TYPES,
          },
          autoProceed: false,
        });

        nextUppy.addUploader(async (fileIDs) => {
          const file = nextUppy.getFile(fileIDs[0]);
          if (!file) return;

          setPhase("uploading");
          setError(null);

          try {
            await uploadFileToS3({
              uppy: nextUppy,
              file,
              uploadUrl: uploadSession.upload_url,
              s3Key: uploadSession.s3_key,
              xhrRef,
            });

            setPhase("polling");

            let message;
            if (PREVIEW_STATUS_FILETYPES.includes(filetype)) {
              await apiPut(`/retailers/${retailerId}/uploads/${uploadSession.requestid}`, {
                status: "Preview",
                filename: file.name,
              });
              message = SESSION_UPLOAD_SUCCESS_MESSAGE;
            } else if (PROCESS_ON_PENDING_FILETYPES.includes(filetype)) {
              if (FILENAME_UPDATE_FILETYPES.includes(filetype)) {
                await apiPut(`/retailers/${retailerId}/uploads/${uploadSession.requestid}`, {
                  filename: file.name,
                });
              }
              await apiPost(`/retailers/${retailerId}/uploads/${uploadSession.requestid}/process`);
              message = "File uploaded and processed successfully";
            } else {
              message = await pollUploadStatus(uploadSession.requestid);
            }

            if (!cancelledRef.current) {
              setPhase("success");
              setSuccessMessage(message);
              fetchHistory();
              onSuccess(message);
            }
          } catch (err) {
            if (!cancelledRef.current) {
              setPhase("error");
              setError(err.message);
              onError(err.message);
            }
            throw err;
          }
        });

        setSession(uploadSession);
        setUppy(nextUppy);
        setPhase("ready");
      } catch (err) {
        if (!cancelledRef.current) {
          onError(err.message);
          onClose();
        }
      }
    };

    requestUploadSession();

    return () => {
      cancelledRef.current = true;
    };
  }, [onClose, onError, onSuccess, pollUploadStatus, retailerId, filetype, filename, week, fiscalDate, fetchHistory]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (xhrRef.current) xhrRef.current.abort();
      uppy?.destroy();
    };
  }, [uppy]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: bg, borderColor: border }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: border }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: textPri }}>{title}</h2>
            {/* {session?.filename && <p className="mt-1 text-xs" style={{ color: textSec }}>{session.filename}</p>} */}
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={!canClose}
            className="text-2xl cursor-pointer leading-none hover:opacity-60 transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: textSec }}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="p-6">
          {phase === "preparing" && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-transparent" style={{ borderTopColor: accent }} />
              <p className="text-sm font-medium" style={{ color: textSec }}>Preparing upload...</p>
            </div>
          )}

          {phase === "ready" && uppy && (
            <Dashboard
              uppy={uppy}
              proudlyDisplayPoweredByUppy={false}
              width="100%"
              height={340}
            />
          )}

          {(phase === "uploading" || phase === "polling") && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-transparent" style={{ borderTopColor: accent }} />
              <p className="text-sm font-medium" style={{ color: textSec }}>
                {phase === "uploading" ? "Uploading file..." : "Processing uploaded file..."}
              </p>
            </div>
          )}

          {phase === "success" && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="max-w-md text-sm font-medium" style={{ color: textPri }}>
                {successMessage || "Upload completed successfully."}
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="max-w-md text-sm font-medium" style={{ color: "#dc2626" }}>
                {error || "Upload failed."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
