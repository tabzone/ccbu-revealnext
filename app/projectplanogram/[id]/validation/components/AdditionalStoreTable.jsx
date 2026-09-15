import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const AdditionalStoreTable = ({ data, sortConfig, onSort, theme }) => {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};

    const SortIcon = ({ columnKey }) => {
        if (sortConfig?.key !== columnKey) {
            return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{ color: textSec || "#9ca3af" }} />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />
            : <ArrowDown className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />;
    };

    return (
        <>

            <div className="flex-1 overflow-auto h-full">
                <div style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }} className="rounded-lg shadow-sm border overflow-hidden relative h-full">
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead style={{ backgroundColor: bgSub || "#f9fafb", borderColor: border || "#e5e7eb" }} className="border-b shadow sticky top-0 z-[1]">
                                <tr>
                                    <th
                                        onClick={() => onSort('extrastore')}
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-0 z-0 w-32">
                                        <div className="flex items-center gap-1">
                                            Extra Store
                                            <SortIcon columnKey="extrastore" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('chchainname')}
                                        style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937", borderColor: border || "#e5e7eb" }}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-32 w-48 border-r">
                                        <div className="flex items-center gap-1">
                                            Chain Name
                                            <SortIcon columnKey="chchainname" />
                                        </div>
                                    </th>
                                    <th style={{ color: textPri || "#1f2937" }} className="px-4 py-3 text-left text-sm font-semibold">
                                        Account group Id
                                    </th>
                                    <th onClick={() => onSort('ibasecallpointid')}
                                        style={{ color: textPri || "#1f2937" }}
                                        className="px-4 py-3 text-left text-sm font-semibold">
                                        <div className="flex items-center gap-1">
                                            Account group Name
                                            <SortIcon columnKey="ibasecallpointid" />
                                        </div>
                                    </th>

                                </tr>
                            </thead>
                            <tbody style={{ borderColor: border || "#e5e7eb" }} className="divide-y -z-0">
                                {
                                    data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="50" className="text-center py-10" style={{ color: textSec || "#6b7280" }}>
                                                No data found
                                            </td>
                                        </tr>
                                    ) :
                                        data?.map((item, i) => (
                                            <tr key={i} className="transition-colors"
                                                style={{ borderColor: border || "#e5e7eb" }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover || "#f9fafb"}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                <td style={{ backgroundColor: bg || "#fff", color: textSec || "#6b7280", borderColor: border || "#e5e7eb" }} className="px-4 py-3 text-sm sticky left-0 w-32"
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover || "#f9fafb"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bg || "#fff"}>
                                                    {item?.extrastore || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>

                                                <td style={{ backgroundColor: bg || "#fff", color: textPri || "#1f2937", borderColor: border || "#e5e7eb" }} className="px-4 py-3 text-sm font-medium sticky left-32 w-48 border-r shadow-xl whitespace-normal break-words"
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover || "#f9fafb"}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bg || "#fff"}>
                                                    {item?.chchainname || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>
                                                <td style={{ color: textSec || "#6b7280" }} className="px-4 py-3 text-sm">
                                                    {item?.ibasecallpointid || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
                                                </td>
                                                <td style={{ color: textSec || "#6b7280" }} className="px-4 py-3 text-sm w-48">
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

export default AdditionalStoreTable;
