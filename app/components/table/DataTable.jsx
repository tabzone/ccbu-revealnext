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

export default function DataTable({ rows, loading }) {
  return (
    <div className="bg-white dark:bg-[#191919] rounded-xl shadow-sm border border-gray-200 dark:border-[#333333] overflow-hidden">
      <div className="overflow-auto">
        <table className="min-w-full">
          <thead className="sticky top-0 bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333333] z-10">
            <tr>
              {COLUMNS.map((col,ind) => (
                <th
                  key={ind}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Loading retailers…
                  </span>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((row) => {
                const rid = row.retailerid ?? row.id;
                const name = row.name ?? row.retailer_name ?? "—";
                const setStatus = row.set_status ?? row.setStatus ?? "—";
                const status = row.status ?? "—";

                return (
                  <tr key={rid} className="border-b border-gray-200 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#242424] transition">
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(row.created_at ?? row.created)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/retailerPlanogram/${rid}/products`}
                        className="text-[#F40009] hover:underline font-medium"
                      >
                        {name}
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {setStatus}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {row.planograms ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {row.products ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {row.stores ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status === "Archived"
                            ? "bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300"
                            : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {row.users ?? row.user ?? "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="py-16 text-center text-gray-500 dark:text-gray-400">
                  No retailers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#2a2a2a]">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? "Loading…" : `Showing ${rows.length} retailer${rows.length !== 1 ? "s" : ""}`}
        </div>
      </div>
    </div>
  );
}
