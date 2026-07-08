"use client";

import { PAGE_SIZE } from "@/data/constants";

const COLS = [
  { label: "Store #", key: "store" },
  { label: "Region", key: "region" },

  // { label: "Store Leader", key: "store_leader" },
  { label: "Address", key: null },
  { label: "City", key: "city" },
  { label: "State", key: "state" },
  { label: "District", key: "district" },
  { label: "Phone", key: null },
  { label: "Opened", key: "opened" },
  { label: "Kitchen", key: null },
  { label: "Status", key: null },
  { label: "POG Status", key: null },

  { label: "", key: null },
];

function SortIcon({ active, dir }) {
  if (!active) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.35 }}>
        <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0 }} />
      </svg>
    );
  }
  return dir === "asc" ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StoresTable({
  stores,
  total,
  page,
  totalPages,
  loading,
  apiError,
  sortBy,
  sortDir,
  onPageChange,
  onSort,
  onEdit,
  onDelete,
  onRetry,
  theme,
}) {
  const { bg, bgSub, border, textPri, textSec, hover, accent } = theme;
  const isDark = theme.accent === "#f87171";

  const pageNumbers = (() => {
    const max = Math.min(totalPages, 5);
    const start = Math.max(0, Math.min(page - 2, totalPages - max));
    return Array.from({ length: max }, (_, i) => start + i);
  })();

  const paginationStart = page * PAGE_SIZE + 1;
  const paginationEnd = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div style={{ backgroundColor: bg, borderColor: border }} className="flex-1 flex flex-col min-h-0 rounded-xl border shadow-sm overflow-hidden">
      {apiError ? (
        <div className="py-20 text-center">
          <p style={{ color: accent }} className="font-medium text-sm">Failed to load: {apiError}</p>
          <button onClick={onRetry} style={{ color: accent }} className="text-sm mt-2 underline hover:opacity-70 cursor-pointer">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr style={{ backgroundColor: bgSub, borderColor: border }} className="border-b">
                  {COLS.map((col) => (
                    <th
                      key={col.label}
                      onClick={() => col.key && onSort(col.key)}
                      style={{
                        color: sortBy === col.key ? accent : textSec,
                        backgroundColor: bgSub,
                        cursor: col.key ? "pointer" : "default",
                      }}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.key && (
                          <span style={{ color: sortBy === col.key ? accent : textSec }}>
                            <SortIcon active={sortBy === col.key} dir={sortDir} />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderColor: border }} className="border-b">
                      {COLS.map((col) => (
                        <td key={col.label} className="px-5 py-4">
                          <div style={{ backgroundColor: bgSub }} className="h-4 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                  : stores.length === 0
                    ? (
                      <tr>
                        <td colSpan={COLS.length} className="py-16 text-center">
                          <p style={{ color: textSec }} className="text-sm">No stores found</p>
                        </td>
                      </tr>
                    )
                    : stores.map((row) => (
                      <tr
                        key={row.store}
                        style={{ borderColor: border }}
                        className="border-b transition-colors cursor-pointer"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ color: accent }} className="px-5 py-3.5 font-bold text-sm">{row.store}</td>
                        {/* <td style={{ color: textPri }} className="px-5 py-3.5 font-medium text-sm whitespace-nowrap">
                          {row.store_leader ?? "—"}
                        </td> */}
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm">{row.region ?? "—"}</td>

                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm">{row.address ?? "—"}</td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm">{row.city ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          {row.state ? (
                            <span
                              style={{
                                backgroundColor: isDark ? "#1e2d45" : "#eff6ff",
                                color: isDark ? "#93c5fd" : "#1d4ed8",
                              }}
                              className="inline-flex px-2.5 py-1 rounded text-xs font-semibold"
                            >
                              {row.state}
                            </span>
                          ) : <span style={{ color: textSec }}>—</span>}
                        </td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm">{row.district ?? "—"}</td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.phone ?? "—"}</td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.opened ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          {row.kitchen ? (
                            <span
                              style={{
                                backgroundColor: isDark ? "#1a472a" : "#f0fdf4",
                                color: "#16a34a",
                              }}
                              className="inline-flex px-2.5 py-1 rounded text-xs font-semibold"
                            >
                              Yes
                            </span>
                          ) : (
                            <span style={{ color: textSec }}>—</span>
                          )}
                        </td>
                        <td
                          style={{ color: textSec }}
                          className="px-5 py-3.5 text-sm whitespace-nowrap"
                        >
                          <span
                            style={
                              row.status === "Archived"
                                ? {
                                  backgroundColor: isDark ? "#7f1d1d" : "#fee2e2",
                                  color: isDark ? "#fca5a5" : "#dc2626",
                                }
                                : {
                                  backgroundColor: isDark ? "#14532d" : "#dcfce7",
                                  color: isDark ? "#86efac" : "#15803d",
                                }
                            }
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          >
                            {row.status ?? "—"}
                          </span>
                        </td>
                        <td
                          style={{ color: textSec }}
                          className="px-5 py-3.5 text-sm whitespace-nowrap"
                        >
                          <span
                            style={
                              row.pog_status
                                ? {
                                  backgroundColor: isDark ? "#14532d" : "#dcfce7",
                                  color: isDark ? "#86efac" : "#15803d",
                                }
                                : {
                                  backgroundColor: isDark ? "#7f1d1d" : "#fee2e2",
                                  color: isDark ? "#fca5a5" : "#dc2626",
                                }
                            }
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          >
                            {row.pog_status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                              style={{ color: textSec }}
                              className="p-1.5 rounded hover:opacity-60 transition cursor-pointer"
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div style={{ borderColor: border, backgroundColor: bg }} className="border-t px-5 py-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <span style={{ color: textSec }} className="text-sm">
              {loading
                ? "Loading…"
                : total === 0
                  ? "No results"
                  : `${paginationStart}–${paginationEnd} of ${total} stores`}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(0)} disabled={page === 0} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer  font-medium disabled:opacity-30 hover:opacity-70 transition">{"<<"}</button>
                <button onClick={() => onPageChange(page - 1)} disabled={page === 0} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs font-medium disabled:opacity-30 hover:opacity-70 transition">{"<"}</button>

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    style={{
                      backgroundColor: p === page ? accent : "transparent",
                      borderColor: p === page ? accent : border,
                      color: p === page ? "#fff" : textPri,
                    }}
                    className="w-8 h-8 rounded-lg border text-xs font-medium hover:opacity-80 transition cursor-pointer"
                  >
                    {p + 1}
                  </button>
                ))}

                <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer font-medium disabled:opacity-30 hover:opacity-70 transition">{">"}</button>
                <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer font-medium disabled:opacity-30 hover:opacity-70 transition">{">>"}</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
