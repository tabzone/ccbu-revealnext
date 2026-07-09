"use client"

import { useState } from "react";

export function UsersTable({
    users,
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
    onToggleStatus,
    statusUpdatingUserId,
    onRetry,
    theme,
}) {
    const [expandedUID, setExpandedUID] = useState(null);

    const handleSort = (key) => {
        onSort(key);
    };

    const renderSortIcon = (key) => {
        if (sortBy !== key) {
            return <span style={{ color: theme.textSec }}>⇅</span>;
        }
        return sortDir === "asc" ? "↑" : "↓";
    };

    const handlePrevPage = () => {
        if (page > 0) onPageChange(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) onPageChange(page + 1);
    };

    if (apiError) {
        return (
            <div
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl"
                style={{ backgroundColor: theme.bgSub, border: `1px solid ${theme.border}` }}
            >
                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: "#ef4444" }}
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ color: theme.textPri }}>Error loading users: {apiError}</p>
                <button
                    onClick={onRetry}
                    style={{ backgroundColor: theme.accent }}
                    className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // if (loading && users.length === 0) {
    //     return (
    //         <div
    //             className="flex items-center justify-center gap-3 p-12 rounded-xl"
    //             style={{ backgroundColor: theme.bgSub, border: `1px solid ${theme.border}` }}
    //         >
    //             <div
    //                 className="w-5 h-5 border-2 border-transparent rounded-full animate-spin"
    //                 style={{ borderTopColor: theme.accent }}
    //             />
    //             <p style={{ color: theme.textSec }}>Loading users…</p>
    //         </div>
    //     );
    // }

    // if (!loading && users.length === 0) {
    //     return (
    //         <div
    //             className="flex flex-col items-center justify-center gap-2 p-12 rounded-xl"
    //             style={{ backgroundColor: theme.bgSub, border: `1px solid ${theme.border}` }}
    //         >
    //             <svg
    //                 width="40"
    //                 height="40"
    //                 viewBox="0 0 24 24"
    //                 fill="none"
    //                 stroke="currentColor"
    //                 strokeWidth="1.5"
    //                 style={{ color: theme.textSec }}
    //             >
    //                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
    //             </svg>
    //             <p style={{ color: theme.textPri }}>No users found</p>
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Table */}
            <div
                className="flex-1 overflow-auto rounded-xl border"
                style={{ borderColor: theme.border, backgroundColor: theme.bg }}
            >
                <table className="w-full text-sm">
                    <thead
                        className="sticky top-0 z-10"
                        style={{ backgroundColor: theme.bgSub, borderBottomColor: theme.border }}
                    >
                        <tr className="border-b" style={{ borderColor: theme.border }}>
                            <th className="px-4 py-3 text-left font-semibold" style={{ color: theme.textPri }}>
                                Name
                            </th>
                            <th className="px-4 py-3 text-left font-semibold" style={{ color: theme.textPri }}>
                                Email
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold cursor-pointer hover:opacity-75"
                                style={{ color: theme.textPri }}
                                onClick={() => handleSort("role")}
                            >
                                Role {renderSortIcon("role")}
                            </th>
                            <th
                                className="px-4 py-3 text-left font-semibold cursor-pointer hover:opacity-75"
                                style={{ color: theme.textPri }}
                                onClick={() => handleSort("active")}
                            >
                                Status {renderSortIcon("active")}
                            </th>
                            <th className="px-4 py-3 text-right font-semibold" style={{ color: theme.textPri }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            loading
                                ? Array.from({ length: 8 }).map((_, index) => (
                                    <tr
                                        key={index}
                                        className="border-b"
                                        style={{ borderColor: theme.border }}
                                    >
                                        {[1, 2, 3, 4, 5].map((cell) => (
                                            <td key={cell} className="px-4 py-3">
                                                <div
                                                    className="h-4 rounded animate-pulse"
                                                    style={{
                                                        backgroundColor: theme.bgSub,
                                                        width:
                                                            cell === 5
                                                                ? "60px"
                                                                : cell === 1
                                                                    ? "140px"
                                                                    : "100%",
                                                    }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                                :
                                users.map((user) => {
                                    const isActive = typeof user.active === "boolean"
                                        ? user.active
                                        : user.status === "Active";
                                    const isUpdating = statusUpdatingUserId === user.userid;

                                    return (
                                        <tr
                                            key={user.userid}
                                            className="border-b transition hover:opacity-75"
                                            style={{ borderColor: theme.border }}
                                        >
                                            <td className="px-4 py-3" style={{ color: theme.textPri }}>
                                                <div className="font-medium">
                                                    {user.fname} {user.lname}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3" style={{ color: theme.textSec }}>
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-3" style={{ color: theme.textSec }}>
                                                <span
                                                    className="px-2 py-1 rounded text-xs font-medium"
                                                    style={{
                                                        backgroundColor: theme.bgSub,
                                                        color: theme.textPri,
                                                    }}
                                                >
                                                    {user.role || "User"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleStatus(user)}
                                                    disabled={isUpdating}
                                                    aria-busy={isUpdating}
                                                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70"
                                                    style={{
                                                        backgroundColor: isActive ? "#334155" : "#D1D5DB",
                                                    }}
                                                >
                                                    {isUpdating ? (
                                                        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                    ) : (
                                                        <span
                                                            className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
                                                            style={{
                                                                transform: isActive
                                                                    ? "translateX(22px)"
                                                                    : "translateX(2px)",
                                                            }}
                                                        />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => onEdit(user)}
                                                        className="p-2 rounded hover:opacity-75 transition"
                                                        style={{ backgroundColor: theme.bgSub }}
                                                        title="Edit"
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            style={{ color: theme.accent }}
                                                        >
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    {/* <button
                                            onClick={() => onDelete(user)}
                                            className="p-2 rounded hover:opacity-75 transition"
                                            style={{ backgroundColor: theme.bgSub }}
                                            title="Delete"
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                style={{ color: "#ef4444" }}
                                            >
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                <line x1="14" y1="11" x2="14" y2="17" />
                                            </svg>
                                        </button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{ borderColor: theme.border, backgroundColor: theme.bgSub }}
                >
                    <p style={{ color: theme.textSec }} className="text-sm">
                        Page {page + 1} of {totalPages} • {total} total users
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 0}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            style={{
                                backgroundColor: page === 0 ? theme.bgSub : theme.accent,
                                color: page === 0 ? theme.textSec : "#ffffff",
                            }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={page >= totalPages - 1}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            style={{
                                backgroundColor: page >= totalPages - 1 ? theme.bgSub : theme.accent,
                                color: page >= totalPages - 1 ? theme.textSec : "#ffffff",
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
