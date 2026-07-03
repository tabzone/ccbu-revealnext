"use client";

import { createPortal } from "react-dom";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.css";
import AppLayout from "@/app/components/layout/AppLayout";
import { FilterBar } from "@/app/components/FilterBar";
import { ProductsTable } from "@/app/components/table/ProductsTable";
import { ProductModal } from "@/app/components/modal/ProductModal";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { Toast } from "@/app/components/Toast";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet, apiPost } from "@/lib/api";
import { PAGE_SIZE, url } from "@/data/constants";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Icons for upload cards ───────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "products", label: "Master Products" },
  { key: "upload",   label: "Upload Master Products" },
];

// ─── Helper: Frontend sorting ──────────────────────────────────────────────────

function sortProducts(products, sortBy, sortDir) {
  if (!sortBy) return products;

  const sorted = [...products].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // String comparison
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal);
    }

    // Numeric comparison
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });

  return sortDir === "desc" ? sorted.reverse() : sorted;
}

const PRODUCT_UPLOAD_POLL_INTERVAL_MS = 2000;
const PRODUCT_UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;
const PRODUCT_UPLOAD_FILE_TYPES = [".xlsx", ".xls", ".csv"];

function normalizeUploadStatus(value) {
  const status = String(value ?? "").toLowerCase();
  if (["success", "succeeded", "completed", "complete"].includes(status)) return "success";
  if (["failed", "failure", "error"].includes(status)) return "failed";
  return "pending";
}

function extractUploadRows(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.uploads)) return data.uploads;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.history)) return data.history;
  return [];
}

function StatusBadge({ status }) {
  const normalized = normalizeUploadStatus(status);
  const config = {
    success: { bg: "#dcfce7", color: "#15803d", label: "Success" },
    failed: { bg: "#fee2e2", color: "#dc2626", label: "Failed" },
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

function ProductUploadModal({ retailerId, theme, onClose, onSuccess, onError }) {
  const { bg, border, textPri, textSec, accent } = theme;
  const [phase, setPhase] = useState("preparing");
  const [session, setSession] = useState(null);
  const [uppy, setUppy] = useState(null);
  const [error, setError] = useState(null);
  const pollTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const xhrRef = useRef(null);

  const canClose = phase === "ready" || phase === "error";

  const closeModal = useCallback(() => {
    if (!canClose) return;
    onClose();
  }, [canClose, onClose]);

  const pollUploadStatus = useCallback(async (requestid) => {
    const startedAt = Date.now();

    while (!cancelledRef.current && Date.now() - startedAt < PRODUCT_UPLOAD_TIMEOUT_MS) {
      const res = await apiGet(`/retailers/${retailerId}/uploads/${requestid}`);
      const payload = res?.data ?? res;
      const status = normalizeUploadStatus(payload?.status);

      if (status === "success") {
        onSuccess(payload?.message ?? "Products uploaded successfully");
        return;
      }

      if (status === "failed") {
        throw new Error(payload?.message ?? payload?.detail ?? "Product upload processing failed");
      }

      await waitForUploadPoll(PRODUCT_UPLOAD_POLL_INTERVAL_MS, pollTimerRef, cancelledRef);
    }

    throw new Error("Product upload status timed out after 2 minutes");
  }, [onSuccess, retailerId]);

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
          filetype: "PRD",
          filename: "retailerProduct.xlsx",
          week: "",
          fiscal_date: "",
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
            allowedFileTypes: PRODUCT_UPLOAD_FILE_TYPES,
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
            await pollUploadStatus(uploadSession.requestid);
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
  }, [onClose, onError, pollUploadStatus, retailerId]);

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
            <h2 className="text-xl font-semibold" style={{ color: textPri }}>Upload Products</h2>
            {session?.filename && <p className="mt-1 text-xs" style={{ color: textSec }}>{session.filename}</p>}
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={!canClose}
            className="text-2xl leading-none hover:opacity-60 transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: textSec }}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="p-6">
          {phase === "preparing" ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-transparent" style={{ borderTopColor: accent }} />
              <p className="text-sm font-medium" style={{ color: textSec }}>Preparing upload...</p>
            </div>
          ) : (
            <>
              {uppy && (
                <Dashboard
                  uppy={uppy}
                  proudlyDisplayPoweredByUppy={false}
                  width="100%"
                  height={340}
                  hideCancelButton={phase === "uploading" || phase === "polling"}
                  disabled={phase === "uploading" || phase === "polling"}
                />
              )}
              {phase === "polling" && (
                <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: textSec }}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" style={{ borderTopColor: accent }} />
                  Processing uploaded file...
                </div>
              )}
              {error && (
                <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProductUploadSection({ retailerId, theme, addToast }) {
  const { bg, bgSub, border, textPri, textSec, accent, hover } = theme;
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(() => {
    if (!retailerId) return;

    setHistoryLoading(true);
    apiGet(`/retailers/${retailerId}/uploads`)
      .then((res) => {
        const rows = extractUploadRows(res)
          .sort((a, b) => new Date(b.created_at ?? b.uploaded_at ?? 0) - new Date(a.created_at ?? a.uploaded_at ?? 0));
        setHistory(rows);
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [retailerId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleUploadClose = useCallback(() => {
    setUploadModalOpen(false);
  }, []);

  const handleUploadError = useCallback((message) => {
    addToast(message, "error");
  }, [addToast]);

  const handleUploadSuccess = useCallback((message) => {
    addToast(message);
    fetchHistory();
    setUploadModalOpen(false);
  }, [addToast, fetchHistory]);

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div
        className="flex items-center justify-between gap-3 flex-shrink-0 rounded-xl border px-5 py-3.5"
        style={{ backgroundColor: bgSub, borderColor: border }}
      >
        <a
          href={url("/products/template")}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition hover:opacity-80"
          style={{ borderColor: border, color: textPri, backgroundColor: bg }}
        >
          <DownloadIcon />
          Products Template
        </a>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          style={{ backgroundColor: accent }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
        >
          <UploadIcon />
          Upload Products
        </button>
      </div>

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
                {["File Name", "Uploaded At", "Status"].map((col) => (
                  // "Week", "Failed Rows"
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ backgroundColor: bgSub, color: textSec }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm" style={{ color: textSec }}>Loading...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-sm" style={{ color: textSec }}>No uploads yet.</td>
                </tr>
              ) : (
                history.map((row, i) => (
                  <tr
                    key={row.requestid ?? row.id ?? i}
                    className="border-b transition"
                    style={{ borderColor: border }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                  >
                    <td className="px-5 py-3 font-medium max-w-[260px] truncate" style={{ color: textPri }} title={row.file_name ?? row.filename}>
                      {row.file_name ?? row.filename ?? "-"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                      {row.created_at || row.uploaded_at ? new Date(row.created_at ?? row.uploaded_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                    {/* <td className="px-5 py-3" style={{ color: textPri }}>{row.total_rows ?? row.records ?? "-"}</td>
                    <td className="px-5 py-3" style={{ color: (row.failed_rows ?? 0) > 0 ? "#dc2626" : textSec }}>
                      {row.failed_rows ?? "-"}
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {uploadModalOpen && (
        <ProductUploadModal
          retailerId={retailerId}
          theme={theme}
          onClose={handleUploadClose}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      )}
    </div>
  );
}

export default function MasterProductsPage() {
  const params = useParams();
  const retailerId = params?.id;
  const { theme: mode } = useTheme();
  const isDark = mode === "dark";

  const th = {
    bg:      isDark ? "#191919" : "#ffffff",
    bgSub:   isDark ? "#2a2a2a" : "#f9fafb",
    bgDrop:  isDark ? "#242424" : "#ffffff",
    border:  isDark ? "#333333" : "#e5e7eb",
    textPri: isDark ? "#e5e7eb" : "#1f2937",
    textSec: isDark ? "#9ca3af" : "#6b7280",
    hover:   isDark ? "#242424" : "#f9fafb",
    accent:  isDark ? "#f87171" : "#dc2626",
  };

  // ── tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("products");

  // ── products state ─────────────────────────────────────────────────────────
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState(null);

  // ── filter options ─────────────────────────────────────────────────────────
  const [opts, setOpts] = useState({ categories: [], brands: [], manufacturers: [], segments: [] });

  // ── filters ────────────────────────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter,     setCategoryFilter]     = useState("");
  const [brandFilter,        setBrandFilter]        = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [segmentFilter,      setSegmentFilter]      = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  // Debounce the search query separately
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── modals ─────────────────────────────────────────────────────────────────
  const [modal,        setModal]        = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── toasts ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      let res;
      if (debouncedSearch) {
        // Search endpoint: only q parameter
        res = await apiGet("/searchproducts", {
          q: debouncedSearch,
        });
      } else {
        // List endpoint: skip, limit + filters only (no sort params)
        res = await apiGet("/listproducts", {
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          category: categoryFilter || undefined,
          brand: brandFilter || undefined,
          manufacturer: manufacturerFilter || undefined,
          segment: segmentFilter || undefined,
        });
      }
      const payload = res?.data ?? res;

      let fetchedProducts = payload?.products ?? [];
      
      // Apply frontend sorting
      fetchedProducts = sortProducts(fetchedProducts, sortBy, sortDir);
      
      setProducts(fetchedProducts);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, brandFilter, manufacturerFilter, segmentFilter, sortBy, sortDir]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── populate filter dropdowns ──────────────────────────────────────────────
  useEffect(() => {
    apiGet("/listproducts", { limit: 100 })
      .then((res) => {
        const p = (res?.data ?? res)?.products ?? [];
        setOpts({
          categories:    [...new Set(p.map((x) => x.category).filter(Boolean))].sort(),
          brands:        [...new Set(p.map((x) => x.brand).filter(Boolean))].sort(),
          manufacturers: [...new Set(p.map((x) => x.manufacturer).filter(Boolean))].sort(),
          segments:      [...new Set(p.map((x) => x.segment).filter(Boolean))].sort(),
        });
      })
      .catch(() => {});
  }, []);

  // ── derived ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = searchQuery || categoryFilter || brandFilter || manufacturerFilter || segmentFilter;

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => { setter(e.target.value); setPage(0); };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setManufacturerFilter("");
    setSegmentFilter("");
    setPage(0);
  };

  const handleSaveProduct = (result) => {
    setModal(null);
    fetchProducts();
    addToast(result?.message ?? "Product saved successfully");
  };

  const handleDeleteConfirm = (result) => {
    setDeleteTarget(null);
    fetchProducts();
    addToast(result?.message ?? "Product deleted successfully");
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col gap-4">
        {/* Page header + tab bar */}
        <div className="flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 style={{ color: th.textPri }} className="text-3xl font-bold">Master Products</h1>
              {activeTab === "products" && (
                <p style={{ color: th.textSec }} className="mt-1 text-sm">
                  {loading ? "Loading…" : `${total} product${total !== 1 ? "s" : ""} total`}
                </p>
              )}
            </div>
            {/* {activeTab === "products" && (
              <button
                onClick={() => setModal("add")}
                style={{ backgroundColor: th.accent }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Product
              </button>
            )} */}
          </div>

          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: th.border }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px"
                style={{
                  color: activeTab === tab.key ? th.accent : th.textSec,
                  borderBottomColor: activeTab === tab.key ? th.accent : "transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "products" ? (
          <>
            <FilterBar
              searchQuery={searchQuery}
              searchPlaceholder="Search products…"
              dropdowns={[
                { allLabel: "All Categories",     value: categoryFilter,     options: opts.categories,    onChange: handleFilterChange(setCategoryFilter) },
                { allLabel: "All Brands",         value: brandFilter,        options: opts.brands,        onChange: handleFilterChange(setBrandFilter) },
                { allLabel: "All Manufacturers",  value: manufacturerFilter, options: opts.manufacturers, onChange: handleFilterChange(setManufacturerFilter) },
                { allLabel: "All Segments",       value: segmentFilter,      options: opts.segments,      onChange: handleFilterChange(setSegmentFilter) },
              ]}
              hasFilters={hasFilters}
              onSearchChange={handleSearchChange}
              onClearFilters={handleClearFilters}
              theme={th}
            />
            <ProductsTable
              products={products}
              total={total}
              page={page}
              totalPages={totalPages}
              loading={loading}
              apiError={apiError}
              sortBy={sortBy}
              sortDir={sortDir}
              onPageChange={setPage}
              onSort={handleSort}
              onEdit={(p) => setModal(p)}
              onDelete={(p) => setDeleteTarget(p)}
              onRetry={fetchProducts}
              theme={th}
            />
          </>
        ) : (
          <ProductUploadSection retailerId={retailerId} theme={th} addToast={addToast} />
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ProductModal
          product={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaveProduct}
          theme={th}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          displayName={`UPC ${deleteTarget.upc}`}
          detailLine1={deleteTarget.item_desc || "—"}
          detailLine2={[deleteTarget.brand, deleteTarget.manufacturer].filter(Boolean).join(" — ")}
          apiPath={`/deleteproduct/${deleteTarget.upc}`}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleteConfirm}
          theme={th}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}
