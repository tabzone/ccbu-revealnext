"use client";

import { FilterBar } from "@/app/components/FilterBar";
import AppLayout from "@/app/components/layout/AppLayout";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { StoreModal } from "@/app/components/modal/StoreModal";
import { StoresTable } from "@/app/components/table/StoresTable";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet } from "@/lib/api";
import { PAGE_SIZE } from "@/data/constants";
import { useCallback, useEffect, useState } from "react";


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

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await apiGet("/stores", {
        skip:     page * PAGE_SIZE,
        limit:    PAGE_SIZE,
        search:   debouncedSearch,
        region:   regionFilter,
        state:    stateFilter,
        district: districtFilter,
      });
      setStores(data.stores ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, regionFilter, stateFilter, districtFilter]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  useEffect(() => {
    apiGet("/stores", { limit: 100 })
      .then((data) => {
        const s = data.stores ?? [];
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

  const handleSaveStore = () => { 
    setModal(null); 
    fetchStores(); 
  };

  const handleDeleteConfirm = () => { 
    setDeleteTarget(null); 
    fetchStores(); 
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col gap-4">
        {/* Page header */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div>
            <h1 style={{ color: th.textPri }} className="text-3xl font-bold">Master Stores</h1>
            <p style={{ color: th.textSec }} className="mt-1 text-sm">
              {loading ? "Loading…" : `${total} store${total !== 1 ? "s" : ""} total`}
            </p>
          </div>
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
        </div>

        {/* Filter bar */}
        <FilterBar
          searchQuery={searchQuery}
          regionFilter={regionFilter}
          stateFilter={stateFilter}
          districtFilter={districtFilter}
          regions={opts.regions}
          states={opts.states}
          districts={opts.districts}
          hasFilters={hasFilters}
          onSearchChange={handleSearchChange}
          onRegionChange={handleFilterChange(setRegionFilter)}
          onStateChange={handleFilterChange(setStateFilter)}
          onDistrictChange={handleFilterChange(setDistrictFilter)}
          onClearFilters={handleClearFilters}
          theme={th}
        />

        {/* Table — flex-1 fills remaining height */}
        <StoresTable
          stores={stores}
          total={total}
          page={page}
          totalPages={totalPages}
          loading={loading}
          apiError={apiError}
          onPageChange={setPage}
          onEdit={handleEditStore}
          onDelete={handleDeleteStore}
          onRetry={fetchStores}
          theme={th}
        />
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
          store={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleteConfirm}
          theme={th}
        />
      )}
    </AppLayout>
  );
}