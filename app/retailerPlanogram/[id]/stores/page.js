"use client";

import { FilterBar } from "@/app/components/FilterBar";
import AppLayout from "@/app/components/layout/AppLayout";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { StoreModal } from "@/app/components/modal/StoreModal";
import { StoresTable } from "@/app/components/table/StoresTable";
import { Toast } from "@/app/components/Toast";
import { UploadStoresTab } from "@/app/components/UploadStoresTab";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet } from "@/lib/api";
import { CARDS, PAGE_SIZE, url } from "@/data/constants";
import {
  DownloadIcon,
  UploadIcon,
  StatusBadge,
  normalizeUploadStatus,
  extractUploadRows,
  SessionUploadModal,
  SessionPreviewModal,
} from "@/app/components/upload/SessionUpload";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// ─── Upload file type labels ───────────────────────────────────────────────────

const UPLOAD_TYPE_LABELS = { STR: "Store Data", POG: "Planograms" };
const UPLOAD_TYPE_BADGE_COLORS = {
  STR: { bg: "#dbeafe", color: "#1d4ed8" },
  POG: { bg: "#ede9fe", color: "#7c3aed" },
};
const PREVIEWABLE_UPLOAD_TYPES = ["STR"];


function UploadTypeBadge({ filetype }) {
  const colors = UPLOAD_TYPE_BADGE_COLORS[filetype] ?? { bg: "#f3f4f6", color: "#6b7280" };
  const label = UPLOAD_TYPE_LABELS[filetype] ?? filetype ?? "-";
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: colors.bg, color: colors.color }}>
      {label}
    </span>
  );
}

// ─── Store/Planogram session upload section (mirrors Products upload flow) ────

function StoreSessionUploadSection({ retailerId, theme, addToast }) {
  const { bg, bgSub, border, textPri, textSec, accent, hover } = theme;
  const [activeUploadType, setActiveUploadType] = useState(null);
  const [previewUpload, setPreviewUpload] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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
  }, [addToast, fetchHistory]);

  const handlePreviewConfirmed = useCallback((message) => {
    addToast(message);
    setPreviewUpload(null);
    fetchHistory();
  }, [addToast, fetchHistory]);

  const uploadModalConfig = {
    STR: { filename: "retailerStore.xlsx", title: "Upload Store Data" },
    POG: { filename: "retailerPlanogram.xlsx", title: "Upload Planogram" },
  }[activeUploadType];

  const cards = CARDS;


  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      {/* <div
        className="flex items-center justify-between gap-3 flex-shrink-0 rounded-xl border px-5 py-3.5"
        style={{ backgroundColor: bgSub, borderColor: border }}
      >
        <div className="flex items-center gap-3">
          <a
            href={url("/stores/template")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition hover:opacity-80"
            style={{ borderColor: border, color: textPri, backgroundColor: bg }}
          >
            <DownloadIcon />
            Stores Template
          </a>
          <a
            href={url("/planograms/template")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition hover:opacity-80"
            style={{ borderColor: border, color: textPri, backgroundColor: bg }}
          >
            <DownloadIcon />
            Planogram Template
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveUploadType("STR")}
            style={{ backgroundColor: accent }}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <UploadIcon />
            Upload Store Data
          </button>
          <button
            type="button"
            onClick={() => setActiveUploadType("POG")}
            style={{ backgroundColor: accent }}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <UploadIcon />
            Upload Planogram
          </button>
        </div>
      </div> */}
      <div
        className={`grid gap-4 flex-shrink-0 ${cards.length === 1
            ? "grid-cols-1 max-w-md"
            : "grid-cols-1 sm:grid-cols-2"
          }`}
      >
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
                <h3
                  className="font-semibold text-base"
                  style={{ color: textPri }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: textSec }}
                >
                  {card.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <a
                href={url(card.downloadPath)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition hover:opacity-80"
                style={{
                  borderColor: border,
                  color: textPri,
                  backgroundColor: bg,
                }}
              >
                <DownloadIcon />
                Template
              </a>

              <button
                type="button"
                onClick={() => setActiveUploadType(card.filetype)}
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
                {["Type", "File Name", "Uploaded At", "Status", "Actions"].map((col) => (
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
                history.map((row, i) => {
                  const filetype = row.filetype ?? row.file_type;
                  const canPreview = PREVIEWABLE_UPLOAD_TYPES.includes(filetype);
                  return (
                    <tr
                      key={row.requestid ?? row.id ?? i}
                      className="border-b transition"
                      style={{ borderColor: border }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                    >
                      <td className="px-5 py-3"><UploadTypeBadge filetype={filetype} /></td>
                      <td className="px-5 py-3 font-medium max-w-[260px] truncate" style={{ color: textPri }} title={row.file_name ?? row.filename}>
                        {row.file_name ?? row.filename ?? "-"}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                        {row.created_at || row.uploaded_at ? new Date(row.created_at ?? row.uploaded_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-5 py-3">
                        {canPreview ? (
                          <button
                            type="button"
                            onClick={() => setPreviewUpload(row)}
                            disabled={normalizeUploadStatus(row.status) !== "preview"}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: border, color: textPri, backgroundColor: bg }}
                          >
                            Preview
                          </button>
                        ) : (
                          <span style={{ color: textSec }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeUploadType && (
        <SessionUploadModal
          retailerId={retailerId}
          filetype={activeUploadType}
          filename={uploadModalConfig.filename}
          title={uploadModalConfig.title}
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

// ─── Helper: Frontend sorting ──────────────────────────────────────────────────

function sortStores(stores, sortBy, sortDir) {
  if (!sortBy) return stores;

  const sorted = [...stores].sort((a, b) => {
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

export default function MasterStoresPage() {
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

  const [stores, setStores] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [opts, setOpts] = useState({ regions: [], states: [], districts: [] });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  // Reset page immediately when search starts (not in debounce)
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  // Debounce the search query separately
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const [activeTab, setActiveTab] = useState("stores");

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      let res;
      if (debouncedSearch) {
        // Search API: only q parameter
        res = await apiGet("/searchstores", {
          q: debouncedSearch,
        });
      } else {
        // List API: pagination + filters only (no sort params)
        res = await apiGet("/liststores", {
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          region: regionFilter,
          state: stateFilter,
          district: districtFilter,
        });
      }
      const payload = res?.data ?? res;
      let fetchedStores = payload?.stores ?? [];

      // Apply frontend sorting
      fetchedStores = sortStores(fetchedStores, sortBy, sortDir);

      setStores(fetchedStores);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, regionFilter, stateFilter, districtFilter, sortBy, sortDir]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  useEffect(() => {
    apiGet("/liststores", { limit: 100 })
      .then((res) => {
        const s = (res?.data ?? res)?.stores ?? [];
        setOpts({
          regions: [...new Set(s.map((x) => x.region).filter(Boolean))].sort(),
          states: [...new Set(s.map((x) => x.state).filter(Boolean))].sort(),
          districts: [...new Set(s.map((x) => x.district).filter(Boolean))].sort(),
        });
      })
      .catch(() => { });
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = searchQuery || regionFilter || stateFilter || districtFilter;

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRegionFilter("");
    setStateFilter("");
    setDistrictFilter("");
    setPage(0);
  };

  const handleAddStore = () => setModal("add");

  const handleEditStore = (store) => setModal(store);

  const handleDeleteStore = (store) => setDeleteTarget(store);

  const handleSaveStore = (result) => {
    setModal(null);
    fetchStores();
    addToast(result?.message ?? "Store saved successfully");
  };

  const handleDeleteConfirm = (result) => {
    setDeleteTarget(null);
    fetchStores();
    addToast(result?.message ?? "Store deleted successfully");
  };

  const TABS = [
    { key: "stores", label: "Master Stores" },
    { key: "upload", label: "Upload Master Stores" },
  ];

  return (
    <AppLayout>
      <div className="h-full flex flex-col gap-4">
        {/* Page header + tab bar */}
        <div className="flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 style={{ color: th.textPri }} className="text-3xl font-bold">Master Stores</h1>
              {/* {activeTab === "stores" && (
                <p style={{ color: th.textSec }} className="mt-1 text-sm">
                  {loading ? "Loading…" : `${total} store${total !== 1 ? "s" : ""} total`}
                </p>
              )} */}
            </div>
            {/* {activeTab === "stores" && (
              <button
                onClick={handleAddStore}
                style={{ backgroundColor: th.accent }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Store
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
        {activeTab === "stores" ? (
          <>
            <FilterBar
              searchQuery={searchQuery}
              searchPlaceholder="Search stores…"
              dropdowns={[
                { allLabel: "All Regions", value: regionFilter, options: opts.regions, onChange: handleFilterChange(setRegionFilter) },
                { allLabel: "All States", value: stateFilter, options: opts.states, onChange: handleFilterChange(setStateFilter) },
                { allLabel: "All Districts", value: districtFilter, options: opts.districts, onChange: handleFilterChange(setDistrictFilter) },
              ]}
              hasFilters={hasFilters}
              onSearchChange={handleSearchChange}
              onClearFilters={handleClearFilters}
              theme={th}
            />
            <StoresTable
              stores={stores}
              total={total}
              page={page}
              totalPages={totalPages}
              loading={loading}
              apiError={apiError}
              sortBy={sortBy}
              sortDir={sortDir}
              onPageChange={setPage}
              onSort={handleSort}
              onEdit={handleEditStore}
              onDelete={handleDeleteStore}
              onRetry={fetchStores}
              theme={th}
            />
          </>
        ) : (
          <div className="flex flex-col gap-8 flex-1 min-h-0">
            <StoreSessionUploadSection retailerId={retailerId} theme={th} addToast={addToast} />
            {/* <UploadStoresTab theme={th} addToast={addToast} /> */}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <StoreModal
          store={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaveStore}
          theme={th}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          displayName={`Store #${deleteTarget.store}`}
          detailLine1={deleteTarget.store_leader || "No leader"}
          detailLine2={[deleteTarget.city, deleteTarget.state].filter(Boolean).join(", ")}
          apiPath={`/deletestore/${deleteTarget.store}`}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleteConfirm}
          theme={th}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}