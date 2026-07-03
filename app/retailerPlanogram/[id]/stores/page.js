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
import { PAGE_SIZE } from "@/data/constants";
import { useCallback, useEffect, useState } from "react";

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
  const { theme: mode } = useTheme();
  const isDark = mode === "dark";

  const th = {
    bg:       isDark ? "#191919" : "#ffffff",
    bgSub:    isDark ? "#2a2a2a" : "#f9fafb",
    bgDrop:   isDark ? "#242424" : "#ffffff",
    border:   isDark ? "#333333" : "#e5e7eb",
    textPri:  isDark ? "#e5e7eb" : "#1f2937",
    textSec:  isDark ? "#9ca3af" : "#6b7280",
    hover:    isDark ? "#242424" : "#f9fafb",
    accent:   isDark ? "#f87171" : "#dc2626",
  };

  const [stores, setStores]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(null);

  const [opts, setOpts] = useState({ regions: [], states: [], districts: [] });

  const [searchQuery,    setSearchQuery]    = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [regionFilter,   setRegionFilter]   = useState("");
  const [stateFilter,    setStateFilter]    = useState("");
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

  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts]             = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

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
          skip:     page * PAGE_SIZE,
          limit:    PAGE_SIZE,
          region:   regionFilter,
          state:    stateFilter,
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
          regions:   [...new Set(s.map((x) => x.region).filter(Boolean))].sort(),
          states:    [...new Set(s.map((x) => x.state).filter(Boolean))].sort(),
          districts: [...new Set(s.map((x) => x.district).filter(Boolean))].sort(),
        });
      })
      .catch(() => {});
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
                { allLabel: "All Regions",   value: regionFilter,   options: opts.regions,   onChange: handleFilterChange(setRegionFilter) },
                { allLabel: "All States",    value: stateFilter,    options: opts.states,    onChange: handleFilterChange(setStateFilter) },
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
          <UploadStoresTab theme={th} addToast={addToast} />
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