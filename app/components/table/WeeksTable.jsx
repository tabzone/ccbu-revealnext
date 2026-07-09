"use client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value, withTime = false) {
    if (value === null || value === undefined || value === "") return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return withTime ? d.toLocaleString() : d.toLocaleDateString();
}

function ReadyBadge({ value, textSec }) {
    if (value === null || value === undefined || value === "") {
        return <span className="text-sm" style={{ color: textSec }}>-</span>;
    }
    if (typeof value === "boolean") {
        return (
            <span
                className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                style={value ? { backgroundColor: "#dcfce7", color: "#15803d" } : { backgroundColor: "#f3f4f6", color: "#6b7280" }}
            >
                {value ? "Yes" : "No"}
            </span>
        );
    }
    return <span className="text-sm whitespace-nowrap" style={{ color: textSec }}>{String(value)}</span>;
}

function SortIcon({ direction }) {
    if (!direction) {
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
            </svg>
        );
    }
    return direction === "asc" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 15l4-4 4 4" />
        </svg>
    ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 9l4 4 4-4" />
        </svg>
    );
}

const SORTABLE_COLUMNS = [
    { key: "dataweek", label: "Data Week" },
    { key: "fiscal_week", label: "Fiscal Week" },
    { key: "year", label: "Year" },
];

const STATIC_COLUMNS = [
    "Products",
    "Stores",
    "Market",
    "Sales",
    "Planograms",
    "Published",
    "Created At",
    "Updated At",
];

export function WeeksTable({ weeks, loading, theme, sortConfig, onSort }) {
    const { bg, bgSub, border, textPri, textSec, hover } = theme;
    const totalCols = SORTABLE_COLUMNS.length + STATIC_COLUMNS.length;

    return (
        <div
            className="flex-1 flex flex-col min-h-0 rounded-xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: bg, borderColor: border }}
        >
            <div className="overflow-auto flex-1 min-h-0">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr>
                            {SORTABLE_COLUMNS.map((col) => {
                                const active = sortConfig?.key === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => onSort(col.key)}
                                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none"
                                        style={{ backgroundColor: bgSub, color: active ? textPri : textSec }}
                                    >
                                        <span className="inline-flex items-center gap-1.5">
                                            {col.label}
                                            <SortIcon direction={active ? sortConfig.direction : null} />
                                        </span>
                                    </th>
                                );
                            })}
                            {STATIC_COLUMNS.map((col, ind) => (
                                <th
                                    key={ind}
                                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                                    style={{ backgroundColor: bgSub, color: textSec }}
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={totalCols} className="py-14 text-center text-sm" style={{ color: textSec }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : weeks.length === 0 ? (
                            <tr>
                                <td colSpan={totalCols} className="py-14 text-center text-sm" style={{ color: textSec }}>
                                    No fiscal weeks yet. Click &quot;Create Week&quot; to add one.
                                </td>
                            </tr>
                        ) : (
                            weeks.map((row) => (
                                <tr
                                    key={`${row.dataweek}-${row.year}-${row.fiscal_week}`}
                                    className="border-b transition"
                                    style={{ borderColor: border }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                                >
                                    <td className="px-5 py-3 font-medium whitespace-nowrap" style={{ color: textPri }}>
                                        {row.dataweek ?? "-"}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                                        {row.fiscal_week ?? "-"}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                                        {row.year ?? "-"}
                                    </td>
                                    <td className="px-5 py-3"><ReadyBadge value={row.products_ready} textSec={textSec} /></td>
                                    <td className="px-5 py-3"><ReadyBadge value={row.stores_ready} textSec={textSec} /></td>
                                    <td className="px-5 py-3"><ReadyBadge value={row.market_ready} textSec={textSec} /></td>
                                    <td className="px-5 py-3"><ReadyBadge value={row.sales_ready} textSec={textSec} /></td>
                                    <td className="px-5 py-3"><ReadyBadge value={row.planograms_ready} textSec={textSec} /></td>
                                    <td className="px-5 py-3"><ReadyBadge value={row.published} textSec={textSec} /></td>
                                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                                        {formatDate(row.created_at, true)}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: textSec }}>
                                        {formatDate(row.updated_at, true)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}