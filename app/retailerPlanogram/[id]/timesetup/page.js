"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { CreateWeekModal } from "@/app/components/modal/CreateWeekModal";
import { Toast } from "@/app/components/Toast";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet } from "@/lib/api";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WeeksTable } from "@/app/components/table/WeeksTable";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractWeeks(payload) {
    const data = payload?.data ?? payload;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.weeks)) return data.weeks;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

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
    const { bg, border, textPri, textSec, accent } = th;

    const [weeks, setWeeks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: "year", direction: "desc" });

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

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key !== key) return { key, direction: "asc" };
            if (prev.direction === "asc") return { key, direction: "desc" };
            return { key: null, direction: null };
        });
    };

    const sortedWeeks = useMemo(() => {
        if (!sortConfig.key) return weeks;
        const { key, direction } = sortConfig;
        const dir = direction === "asc" ? 1 : -1;

        return [...weeks].sort((a, b) => {
            const av = a[key];
            const bv = b[key];

            if (av === null || av === undefined) return 1;
            if (bv === null || bv === undefined) return -1;

            if (typeof av === "number" && typeof bv === "number") {
                return (av - bv) * dir;
            }
            return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
        });
    }, [weeks, sortConfig]);

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

                    <WeeksTable
                        weeks={sortedWeeks}
                        loading={loading}
                        theme={th}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
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