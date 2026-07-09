"use client";

import Link from "next/link";

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLUMNS = [
  "Created",
  "Retailer Name",
  "Set Status",
  "Planograms",
  "Products",
  "Stores",
  "Status",
  "Users",
];

const SKELETON_ROWS = 8;

export default function DataTable({ rows, loading, theme }) {
  const { bg, bgSub, border, textSec, hover, accent, isDark } = theme;

  return (
    <div style={{ backgroundColor: bg, borderColor: border }} className="flex-1 flex flex-col min-h-0 rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-auto flex-1 min-h-0">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: bgSub, borderColor: border }} className="border-b">
              {COLUMNS.map((col, ind) => (
                <th
                  key={ind}
                  style={{ backgroundColor: bgSub, color: textSec }}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} style={{ borderColor: border }} className="border-b">
                  {COLUMNS.map((_, ci) => (
                    <td key={ci} className="px-5 py-4">
                      <div
                        style={{ backgroundColor: bgSub }}
                        className="h-4 rounded animate-pulse"
                        // vary widths slightly so it doesn't look like a solid block
                        {...{
                          style: {
                            backgroundColor: bgSub,
                            width: ci === 1 ? "70%" : ci === 6 ? "60px" : "80%",
                            borderRadius: ci === 6 ? 9999 : 6,
                          },
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row) => {
                const rid = row.retailerid ?? row.id;
                const name = row.name ?? row.retailer_name ?? "—";
                const setStatus = row.set_status ?? row.setStatus ?? "—";
                const status = row.status ?? "—";

                return (
                  <tr
                    key={rid}
                    style={{ borderColor: border }}
                    className="border-b transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ color: textSec }} className="px-5 py-4 text-sm whitespace-nowrap">
                      {formatDate(row.created_at ?? row.created)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/retailerPlanogram/${rid}/products`}
                        style={{ color: accent }}
                        className="hover:underline font-medium"
                      >
                        {name}
                      </Link>
                    </td>

                    <td style={{ color: textSec }} className="px-5 py-4 text-sm whitespace-nowrap">
                      {setStatus}
                    </td>

                    <td style={{ color: textSec }} className="px-5 py-4 text-sm whitespace-nowrap">
                      {row.planograms ?? "—"}
                    </td>

                    <td style={{ color: textSec }} className="px-5 py-4 text-sm whitespace-nowrap">
                      {row.products ?? "—"}
                    </td>

                    <td style={{ color: textSec }} className="px-5 py-4 text-sm whitespace-nowrap">
                      {row.stores ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        style={
                          status === "Archived"
                            ? { backgroundColor: bgSub, color: textSec }
                            : { backgroundColor: isDark ? "#14532d" : "#dcfce7", color: isDark ? "#86efac" : "#15803d" }
                        }
                        className="inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                      >
                        {status}
                      </span>
                    </td>

                    <td style={{ color: textSec }} className="px-5 py-4 text-sm whitespace-nowrap">
                      {row.users ?? row.user ?? "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} style={{ color: textSec }} className="py-16 text-center text-sm">
                  No retailers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ borderColor: border, backgroundColor: bg }} className="border-t px-5 py-4 flex-shrink-0">
        <span style={{ color: textSec }} className="text-sm">
          {loading ? "Loading…" : `Showing ${rows.length} retailer${rows.length !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}