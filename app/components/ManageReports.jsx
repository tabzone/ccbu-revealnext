"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "./table/DataTable";
import { apiGet } from "@/lib/api";
import { useTheme } from "@/app/components/ThemeProvider";

export default function ManageReports() {
  const { theme: mode } = useTheme();
  const isDark = mode === "dark";

  const th = {
    bg:      isDark ? "#191919" : "#ffffff",
    bgSub:   isDark ? "#2a2a2a" : "#f9fafb",
    border:  isDark ? "#333333" : "#e5e7eb",
    textPri: isDark ? "#e5e7eb" : "#1f2937",
    textSec: isDark ? "#9ca3af" : "#6b7280",
    hover:   isDark ? "#242424" : "#f9fafb",
    accent:  isDark ? "#f87171" : "#dc2626",
  };
  const { bg, bgSub, border, textPri, textSec, accent } = th;

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
    <div className="h-full flex flex-col gap-4">
      {/* Search + refresh bar */}
      <div
        style={{ backgroundColor: bg, borderColor: border }}
        className="rounded-xl border px-4 py-4 flex flex-wrap justify-between items-center gap-3 flex-shrink-0"
      >
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: textSec }}
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            placeholder="Search retailers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ backgroundColor: bgSub, borderColor: border, color: textPri }}
            className="w-full rounded-lg border pl-9 pr-8 py-2.5 text-sm outline-none transition"
            onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = border)}
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition"
              style={{ color: textSec }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={fetchRetailers}
          disabled={loading}
          className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: border, color: textSec }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      <DataTable rows={filtered} loading={loading} theme={th} />
    </div>
  );
}
