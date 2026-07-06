"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "./table/DataTable";
import { apiGet } from "@/lib/api";

export default function ManageReports() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRetailers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet("/retailers");
      const list = res?.retailers ?? res?.data ?? [];
      setRetailers(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return retailers;
    const q = search.toLowerCase();
    return retailers.filter((r) =>
      (r.name ?? r.retailer_name ?? "").toLowerCase().includes(q)
    );
  }, [retailers, search]);

  return (
    <div className="p-6 bg-[#f8f9fb] dark:bg-[#191919] min-h-screen">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              placeholder="Search retailer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-80 pl-10 pr-4 border border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <svg
              className="absolute left-3 top-3 text-gray-400 dark:text-gray-500"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <button
            onClick={fetchRetailers}
            disabled={loading}
            className="h-10 px-4 border border-gray-300 dark:border-[#333333] cursor-pointer rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50"
          >
            Reload
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <DataTable rows={filtered} loading={loading} />
    </div>
  );
}
