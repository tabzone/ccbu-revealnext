"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { FilterBar } from "@/app/components/FilterBar";
import { ProductsTable } from "@/app/components/table/ProductsTable";
import { ProductModal } from "@/app/components/modal/ProductModal";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { Toast } from "@/app/components/Toast";
import { UploadTab } from "@/app/components/UploadTab";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet } from "@/lib/api";
import { PAGE_SIZE } from "@/data/constants";
import { useCallback, useEffect, useState } from "react";

// ─── Icons for upload cards ───────────────────────────────────────────────────

function ProductIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function PlanogramIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

const UPLOAD_CARDS = [
  {
    key: "products",
    title: "Products Upload",
    description: "Upload master products data (CSV or Excel)",
    uploadPath: "/products/upload",
    downloadPath: "/products/template",
    downloadLabel: "Products Template",
    historyPath: "/products/uploads",
    Icon: ProductIcon,
  },
  {
    key: "planograms",
    title: "Planogram Upload",
    description: "Upload planogram master data (CSV or Excel)",
    uploadPath: "/planograms/upload",
    downloadPath: "/planograms/template",
    downloadLabel: "Planogram Template",
    historyPath: "/planograms/uploads",
    Icon: PlanogramIcon,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "products", label: "Master Products" },
  { key: "upload",   label: "Upload Master Products" },
];

export default function MasterProductsPage() {
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

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 400);
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
      let data;
      if (debouncedSearch) {
        data = await apiGet("/products/search", {
          q:     debouncedSearch,
          skip:  page * PAGE_SIZE,
          limit: PAGE_SIZE,
        });
      } else {
        data = await apiGet("/products", {
          skip:         page * PAGE_SIZE,
          limit:        PAGE_SIZE,
          category:     categoryFilter,
          brand:        brandFilter,
          manufacturer: manufacturerFilter,
          segment:      segmentFilter,
        });
      }
      setProducts(data?.data?.products ?? []);
      setTotal(data?.data?.total ?? 0);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, brandFilter, manufacturerFilter, segmentFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── populate filter dropdowns ──────────────────────────────────────────────
  useEffect(() => {
    apiGet("/products", { limit: 100 })
      .then((data) => {
        const p = data?.data?.products ?? [];
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
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

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
            {activeTab === "products" && (
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
            )}
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
              onPageChange={setPage}
              onEdit={(p) => setModal(p)}
              onDelete={(p) => setDeleteTarget(p)}
              onRetry={fetchProducts}
              theme={th}
            />
          </>
        ) : (
          <UploadTab cards={UPLOAD_CARDS} theme={th} addToast={addToast} />
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
          apiPath={`/products/${deleteTarget.upc}`}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleteConfirm}
          theme={th}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}
