"use client";

import { PAGE_SIZE } from "@/data/constants";

const COLS = ["UPC", "Item Description", "Brand", "Manufacturer", "Category", "Sub-Category", "Segment", "Size", ""];

export function ProductsTable({
  products,
  total,
  page,
  totalPages,
  loading,
  apiError,
  onPageChange,
  onEdit,
  onDelete,
  onRetry,
  theme,
}) {
  const { bg, bgSub, border, textPri, textSec, hover, accent } = theme;

  const pageNumbers = (() => {
    const max   = Math.min(totalPages, 5);
    const start = Math.max(0, Math.min(page - 2, totalPages - max));
    return Array.from({ length: max }, (_, i) => start + i);
  })();

  const paginationStart = page * PAGE_SIZE + 1;
  const paginationEnd   = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div style={{ backgroundColor: bg, borderColor: border }} className="flex-1 flex flex-col min-h-0 rounded-xl border shadow-sm overflow-hidden">
      {apiError ? (
        <div className="py-20 text-center">
          <p style={{ color: accent }} className="font-medium text-sm">Failed to load: {apiError}</p>
          <button onClick={onRetry} style={{ color: accent }} className="text-sm mt-2 underline hover:opacity-70">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr style={{ backgroundColor: bgSub, borderColor: border }} className="border-b">
                  {COLS.map((h) => (
                    <th
                      key={h}
                      style={{ color: textSec, backgroundColor: bgSub }}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} style={{ borderColor: border }} className="border-b">
                        {COLS.map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div style={{ backgroundColor: bgSub }} className="h-4 rounded animate-pulse w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : products.length === 0
                  ? (
                      <tr>
                        <td colSpan={COLS.length} className="py-16 text-center">
                          <p style={{ color: textSec }} className="text-sm">No products found</p>
                        </td>
                      </tr>
                    )
                  : products.map((row) => (
                      <tr
                        key={row.upc}
                        style={{ borderColor: border }}
                        className="border-b transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ color: accent }} className="px-5 py-3.5 font-bold text-sm whitespace-nowrap">
                          {row.upc}
                        </td>
                        <td style={{ color: textPri }} className="px-5 py-3.5 font-medium text-sm max-w-[220px] truncate" title={row.item_desc}>
                          {row.item_desc ?? "—"}
                        </td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.brand ?? "—"}</td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.manufacturer ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          {row.category ? (
                            <span
                              style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
                              className="inline-flex px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap"
                            >
                              {row.category}
                            </span>
                          ) : <span style={{ color: textSec }}>—</span>}
                        </td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.sub_category_desc ?? "—"}</td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.segment ?? "—"}</td>
                        <td style={{ color: textSec }} className="px-5 py-3.5 text-sm whitespace-nowrap">{row.size_desc ?? "—"}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                              style={{ color: textSec }}
                              className="p-1.5 rounded hover:opacity-60 transition"
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                              className="p-1.5 rounded hover:opacity-60 transition"
                              style={{ color: "#dc2626" }}
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
                : `${paginationStart}–${paginationEnd} of ${total} products`}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(0)} disabled={page === 0} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:opacity-70 transition">{"<<"}</button>
                <button onClick={() => onPageChange(page - 1)} disabled={page === 0} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:opacity-70 transition">{"<"}</button>

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    style={{
                      backgroundColor: p === page ? accent : "transparent",
                      borderColor: p === page ? accent : border,
                      color: p === page ? "#fff" : textPri,
                    }}
                    className="w-8 h-8 rounded-lg border text-xs font-medium hover:opacity-80 transition"
                  >
                    {p + 1}
                  </button>
                ))}

                <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:opacity-70 transition">{">"}</button>
                <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} style={{ borderColor: border, color: textPri }} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-30 hover:opacity-70 transition">{">>"}</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
