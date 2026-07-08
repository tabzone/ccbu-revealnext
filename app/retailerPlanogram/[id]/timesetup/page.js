"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { CreateWeekModal } from "@/app/components/modal/CreateWeekModal";
import { Toast } from "@/app/components/Toast";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet } from "@/lib/api";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractWeeks(payload) {
    const data = payload?.data ?? payload;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.weeks)) return data.weeks;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

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

const WEEK_COLUMNS = [
    "Data Week",
    "Fiscal Week",
    "Year",
    "Products Ready",
    "Stores Ready",
    "Market Ready",
    "Sales Ready",
    "Planograms Ready",
    "Published",
    "Created At",
    "Updated At",
];

export default function TimeSetupPage() {
    const params = useParams();
    const retailerId = params?.id;
    const { theme: mode } = useTheme();
    const isDark = mode === "dark";

    const th = {
        bg: isDark ? "#191919" : "#ffffff",
        bgSub: isDark ? "#2a2a2a" : "#f9fafb",
        border: isDark ? "#333333" : "#e5e7eb",
        textPri: isDark ? "#e5e7eb" : "#1f2937",
        textSec: isDark ? "#9ca3af" : "#6b7280",
        hover: isDark ? "#242424" : "#f9fafb",
        accent: isDark ? "#f87171" : "#dc2626",
    };
    const { bg, bgSub, border, textPri, textSec, hover, accent } = th;

    const [weeks, setWeeks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const fetchWeeks = useCallback(() => {
        if (!retailerId) return;
        setLoading(true);
        setApiError(null);
        // apiGet(`/retailers/${retailerId}/weeks`)
        //   .then((res) => setWeeks(extractWeeks(res)))
        apiGet(`/retailers/${retailerId}/weeks`)
            .then((res) => {
                const sortedWeeks = extractWeeks(res).sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );

                setWeeks(sortedWeeks);
            })
            .catch((err) => setApiError(err.message))
            .finally(() => setLoading(false));
    }, [retailerId]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchWeeks(); }, [fetchWeeks]);

    const handleWeekCreated = (result) => {
        setCreateOpen(false);
        addToast(result?.message ?? "Week created successfully");
        fetchWeeks();
    };

    return (
        <AppLayout>
            <div className="h-full flex flex-col gap-4">
                <div className="flex-shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: textPri }}>Time Setup</h1>
                        <p className="mt-1 text-sm" style={{ color: textSec }}>Manage fiscal weeks for this retailer</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        style={{ backgroundColor: accent }}
                        className="flex items-center cursor-pointer gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:self-auto"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create Week
                    </button>
                </div>

                <div
                    className="flex-1 flex flex-col min-h-0 rounded-xl border shadow-sm overflow-hidden"
                    style={{ backgroundColor: bg, borderColor: border }}
                >
                    <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: border }}>
                        <h2 className="text-base font-semibold" style={{ color: textPri }}>Fiscal Weeks</h2>
                        <button
                            onClick={fetchWeeks}
                            className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80"
                            style={{ borderColor: border, color: textSec }}
                        >
                            Refresh
                        </button>
                    </div>

                    {apiError && (
                        <div className="mx-5 mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex-shrink-0">
                            {apiError}
                        </div>
                    )}

                    <div className="overflow-auto flex-1 min-h-0">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    {WEEK_COLUMNS.map((col, ind) => (
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
                                        <td colSpan={WEEK_COLUMNS.length} className="py-14 text-center text-sm" style={{ color: textSec }}>
                                            Loading...
                                        </td>
                                    </tr>
                                ) : weeks.length === 0 ? (
                                    <tr>
                                        <td colSpan={WEEK_COLUMNS.length} className="py-14 text-center text-sm" style={{ color: textSec }}>
                                            No fiscal weeks yet. Click &quot;Create Week&quot; to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    weeks.map((row, i) => (
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
            </div>

            {createOpen && (
                <CreateWeekModal
                    retailerId={retailerId}
                    theme={th}
                    onClose={() => setCreateOpen(false)}
                    onCreated={handleWeekCreated}
                />
            )}

            <Toast toasts={toasts} onDismiss={dismissToast} />
        </AppLayout>
    );
}
