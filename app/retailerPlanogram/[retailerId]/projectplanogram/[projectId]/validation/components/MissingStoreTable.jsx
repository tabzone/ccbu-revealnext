import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const MissingStoreTable = ({ data, sortConfig, onSort, theme }) => {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};

    const SortIcon = ({ columnKey }) => {
        const isActive = sortConfig?.key === columnKey && sortConfig.direction;
        if (!isActive) {
            return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{ color: textSec || "#9ca3af" }} />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 cursor-pointer" style={{ color: accent || "#2563eb" }} />;
        }
        return <ArrowDown className="w-4 h-4 cursor-pointer" style={{ color: accent || "#2563eb" }} />;
    };

    const getSortTitle = (columnKey) => {
        if (sortConfig.key !== columnKey) return "Click to sort";
        if (!sortConfig.direction) return "Sorting cancelled";
        return sortConfig.direction === "desc" ? "Descending" : "Ascending";
    };

    return (
        <>
            <div className="flex-1 overflow-auto h-full">
                <div
                    className="rounded-lg shadow-sm border overflow-hidden relative h-full"
                    style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}
                >
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead
                                className="border-b shadow sticky top-0 z-[1]"
                                style={{ backgroundColor: bgSub || "#f9fafb", borderColor: border || "#e5e7eb" }}
                            >
                                <tr>
                                    <th
                                        onClick={() => onSort('storenumber')}
                                        title={getSortTitle("storenumber")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-0 z-0 w-32"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#111827" }}
                                    >
                                        <div className="flex items-center gap-1">
                                            Store Number
                                            <SortIcon columnKey="storenumber" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => onSort('chchainname')}
                                        title={getSortTitle("chchainname")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-32 w-48 border-r shadow-sm"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#111827", borderColor: border || "#e5e7eb" }}
                                    >
                                        <div className="flex items-center gap-1">
                                            Chain Name
                                            <SortIcon columnKey="chchainname" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ color: textPri || "#111827" }}
                                    >
                                        Account group Id
                                    </th>
                                    <th
                                        onClick={() => onSort('ibasecallpointid')}
                                        title={getSortTitle("ibasecallpointid")}
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ color: textPri || "#111827" }}
                                    >
                                        <div className="flex items-center gap-1">
                                            Account group Name
                                            <SortIcon columnKey="ibasecallpointid" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y -z-0" style={{ borderColor: border || "#e5e7eb" }}>
                                {
                                    data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="50" className="text-center py-10 text-sm" style={{ color: textSec || "#6b7280" }}>
                                                No data found
                                            </td>
                                        </tr>
                                    ) :
                                        data?.map((item, i) => (
                                            <tr
                                                key={i}
                                                className="transition-colors"
                                                style={{ backgroundColor: bg || "#fff" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover || "#f9fafb"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || "#fff"; }}
                                            >
                                                <td
                                                    className="px-4 py-3 text-sm sticky left-0 w-32"
                                                    style={{ backgroundColor: bg || "#fff", color: textSec || "#6b7280" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover || "#f9fafb"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || "#fff"; }}
                                                >
                                                    {item?.storenumber || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>

                                                <td
                                                    className="px-4 py-3 text-sm font-medium sticky left-32 w-48 border-r shadow-xl whitespace-normal break-words"
                                                    style={{ backgroundColor: bg || "#fff", color: textPri || "#111827", borderColor: border || "#e5e7eb" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover || "#f9fafb"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || "#fff"; }}
                                                >
                                                    {item?.chchainname || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm" style={{ color: textSec || "#6b7280" }}>
                                                    {item?.ibasecallpointid || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm w-48" style={{ color: textSec || "#6b7280" }}>
                                                    {item?.chBaseCallPointName || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MissingStoreTable;
