import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";

const ProjectPlanogramTables = ({ data, isLoading, sortConfig, onSort, theme }) => {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};

    const renderSortIcon = (columnKey) => {
        const isActive = sortConfig?.key === columnKey && sortConfig.direction;
        if (!isActive) {
            return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{ color: textSec || "#9ca3af" }} />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />;
        }
        return <ArrowDown className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />;
    };

    const getSortTitle = (columnKey) => {
        if (sortConfig.key !== columnKey) return "Click to sort";
        if (!sortConfig.direction) return "Sorting cancelled";
        return sortConfig.direction === "desc" ? "Descending" : "Ascending";
    };

    return (
        <>
            <div className="flex-1 overflow-auto h-full">
                <div className="rounded-lg border overflow-hidden relative h-full" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="border-b sticky top-0 z-[1]" style={{ backgroundColor: bgSub || "#f9fafb", borderColor: border || "#e5e7eb" }}>
                                <tr>
                                    <th
                                        onClick={() => onSort('pogname')}
                                        title={getSortTitle("pogname")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-0 z-10 w-32"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}>
                                        <div className="flex items-center gap-1">
                                            Planogram Name
                                            {!isLoading && renderSortIcon("pogname")}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('psafile')}
                                        title={getSortTitle("psafile")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-32 w-48 border-r"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937", borderColor: border || "#e5e7eb" }}>
                                        <div className="flex items-center gap-1">
                                            Schematic File
                                            {!isLoading && renderSortIcon("psafile")}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('pogheight')}
                                        title={getSortTitle("pogheight")}
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}>
                                        <div className="flex items-center gap-1">
                                            Planogram Height
                                            {!isLoading && renderSortIcon("pogheight")}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('POGWidth')}
                                        title={getSortTitle("POGWidth")}
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}>
                                        <div className="flex items-center gap-1">
                                            Planogram Width
                                            {!isLoading && renderSortIcon("POGWidth")}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('pogstore')}
                                        title={getSortTitle("pogstore")}
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}>
                                        <div className="flex items-center gap-1">
                                            Store Attached
                                            {!isLoading && renderSortIcon("pogstore")}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('projectproductcount')}
                                        title={getSortTitle("projectproductcount")}
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}>
                                        <div className="flex items-center gap-1">
                                            Product Count
                                            {!isLoading && renderSortIcon("projectproductcount")}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('positioncount')}
                                        title={getSortTitle("positioncount")}
                                        className="px-4 py-3 text-left text-sm font-semibold"
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}>
                                        <div className="flex items-center gap-1">
                                            Position Count
                                            {!isLoading && renderSortIcon("positioncount")}
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y" style={{ borderColor: border || "#e5e7eb" }}>
                                {isLoading ? (
                                    [...Array(10)].map((_, i) => (
                                        <tr key={i} style={{ borderColor: border || "#e5e7eb" }}>
                                            {[...Array(8)].map((__, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="w-full h-4 rounded animate-pulse" style={{ backgroundColor: bgSub || "#e5e7eb" }}></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : data?.length > 0 ? (
                                    data?.map((item, i) => (
                                        <tr
                                            key={i}
                                            className="transition-colors"
                                            style={{ borderColor: border || "#e5e7eb" }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover || "#f9fafb"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                                        >
                                            <td className="px-4 py-3 text-sm sticky left-0 w-32" style={{ backgroundColor: bg || "#fff", color: textPri || "#1f2937" }}>
                                                {item?.pogname || <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm sticky left-32 w-48 border-r" style={{ backgroundColor: bg || "#fff", color: textPri || "#1f2937", borderColor: border || "#e5e7eb" }}>
                                                {item?.psafile || <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm" style={{ color: textPri || "#1f2937" }}>
                                                {item?.pogheight || <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm" style={{ color: textPri || "#1f2937" }}>
                                                {item?.POGWidth
                                                    ? `${Math.round((item.POGWidth / 12) * 100) / 100} ft (${item.POGWidth} in)`
                                                    : <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm" style={{ color: textPri || "#1f2937" }}>
                                                {item?.pogstore || <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm" style={{ color: textPri || "#1f2937" }}>
                                                {item?.projectproductcount || <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm" style={{ color: textPri || "#1f2937" }}>
                                                {item?.positioncount || <span style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-sm" style={{ color: textSec || "#6b7280" }}>
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectPlanogramTables;
