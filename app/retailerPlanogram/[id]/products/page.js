"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { FilterBar } from "@/app/components/FilterBar";
import { ProductsTable } from "@/app/components/table/ProductsTable";
import { ProductModal } from "@/app/components/modal/ProductModal";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { Toast } from "@/app/components/Toast";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet } from "@/lib/api";
import { PAGE_SIZE, url } from "@/data/constants";
import {
  DownloadIcon,
  UploadIcon,
  StatusBadge,
  normalizeUploadStatus,
  extractUploadRows,
  getUploadFilename,
  SessionUploadModal,
  SessionPreviewModal,
} from "@/app/components/upload/SessionUpload";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "products", label: "Master Products" },
  { key: "upload", label: "Upload Master Products" },
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

function ProductUploadSection({ retailerId, theme, addToast }) {
  const { bg, bgSub, border, textPri, textSec, accent, hover } = theme;
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewUpload, setPreviewUpload] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(() => {
    if (!retailerId) return;

    setHistoryLoading(true);
    apiGet(`/retailers/${retailerId}/uploads/PRD`)
      .then((res) => {
        const rows = extractUploadRows(res)
          // .filter((row) => (row.filetype ?? row.file_type) === "PRD")
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
  }, [addToast, fetchHistory]);

  const handlePreviewConfirmed = useCallback((message) => {
    addToast(message);
    setPreviewUpload(null);
    fetchHistory();
  }, [addToast, fetchHistory]);

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div
        className="flex items-center justify-between gap-3 flex-shrink-0 rounded-xl border px-5 py-3.5"
        style={{ backgroundColor: bgSub, borderColor: border }}
      >
        <a
          href={"/Products_template.xlsx"}
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
          className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
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
          <button onClick={fetchHistory} className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80" style={{ borderColor: border, color: textSec }}>
            Refresh
          </button>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                {[ "File Name", "Uploaded At", "Status", "Actions"].map((col) => (
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
                  <td colSpan={4} className="py-14 text-center text-sm" style={{ color: textSec }}>Loading...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-14 text-center text-sm" style={{ color: textSec }}>No uploads yet.</td>
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
                    {/* <td className="px-5 py-3 font-medium max-w-[260px] truncate" style={{ color: textPri }} title={row.file_name ?? row.filename}>
                      {row.requestid ?? row.requestid ?? "-"}
                    </td> */}
                    <td className="px-5 py-3 font-medium max-w-[260px] truncate" style={{ color: textPri }} title={getUploadFilename(row)}>
                      {getUploadFilename(row)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                      {row.created_at || row.uploaded_at ? new Date(row.created_at ?? row.uploaded_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setPreviewUpload(row)}
                        disabled={normalizeUploadStatus(row.status) !== "preview"}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ borderColor: border, color: textPri, backgroundColor: bg }}
                      >
                        Preview
                      </button>
                    </td>
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
        <SessionUploadModal
          retailerId={retailerId}
          theme={theme}
          onClose={handleUploadClose}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          fetchHistory={fetchHistory}
        />
      )}

      {previewUpload && (
        <SessionPreviewModal
          retailerId={retailerId}
          upload={previewUpload}
          theme={theme}
          onClose={() => setPreviewUpload(null)}
          onConfirmed={handlePreviewConfirmed}
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
    bg: isDark ? "#191919" : "#ffffff",
    bgSub: isDark ? "#2a2a2a" : "#f9fafb",
    bgDrop: isDark ? "#242424" : "#ffffff",
    border: isDark ? "#333333" : "#e5e7eb",
    textPri: isDark ? "#e5e7eb" : "#1f2937",
    textSec: isDark ? "#9ca3af" : "#6b7280",
    hover: isDark ? "#242424" : "#f9fafb",
    accent: isDark ? "#f87171" : "#dc2626",
  };

  // ── tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("products");

  // ── products state ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // ── filter options ─────────────────────────────────────────────────────────
  const [opts, setOpts] = useState({ categories: [], brands: [], manufacturers: [], segments: [] });

  // ── filters ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
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
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── toasts ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

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
          categories: [...new Set(p.map((x) => x.category).filter(Boolean))].sort(),
          brands: [...new Set(p.map((x) => x.brand).filter(Boolean))].sort(),
          manufacturers: [...new Set(p.map((x) => x.manufacturer).filter(Boolean))].sort(),
          segments: [...new Set(p.map((x) => x.segment).filter(Boolean))].sort(),
        });
      })
      .catch(() => { });
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
              {/* {activeTab === "products" && (
                <p style={{ color: th.textSec }} className="mt-1 text-sm">
                  {loading ? "Loading…" : `${total} product${total !== 1 ? "s" : ""} total`}
                </p>
              )} */}
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
                className="px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px cursor-pointer" 
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
                { allLabel: "All Categories", value: categoryFilter, options: opts.categories, onChange: handleFilterChange(setCategoryFilter) },
                { allLabel: "All Brands", value: brandFilter, options: opts.brands, onChange: handleFilterChange(setBrandFilter) },
                { allLabel: "All Manufacturers", value: manufacturerFilter, options: opts.manufacturers, onChange: handleFilterChange(setManufacturerFilter) },
                { allLabel: "All Segments", value: segmentFilter, options: opts.segments, onChange: handleFilterChange(setSegmentFilter) },
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
