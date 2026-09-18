import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";

function formatDate(utcDate) {
  if (!utcDate) return "";
  return new Date(utcDate).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

const ProjectReqTable = ({ data, isLoading, sortConfig, onSort, theme }) => {
    const {bg,bgSub,border,textPri,textSec,hover,accent,isDark}=theme||{};

    const SortIcon = ({ columnKey }) => {

        const isActive = sortConfig?.key === columnKey && sortConfig.direction;
        if (!isActive) {
            return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{color: textSec||"#9ca3af"}} />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 cursor-pointer" style={{color: accent||"#334155"}} />;
        }
        return <ArrowDown className="w-4 h-4 cursor-pointer" style={{color: accent||"#334155"}} />;
    };


    const getSortTitle = (columnKey) => {
        if (sortConfig.key !== columnKey) return "Click to sort";
        if (!sortConfig.direction) return "Sorting cancelled";
        return sortConfig.direction === "desc" ? "Descending" : "Ascending";
    };


    return (
        <>
            <div className="flex-1 overflow-auto h-full">
                <div className="rounded-lg shadow-sm border overflow-hidden relative h-full" style={{backgroundColor: bg||"#fff", borderColor: border||"#e5e7eb"}}>
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="border-b shadow sticky top-0 z-[1]" style={{backgroundColor: bgSub||"#f9fafb", borderColor: border||"#e5e7eb"}}>
                                <tr>
                                    <th
                                        onClick={() => onSort('filetype')}
                                        title={getSortTitle("filetype")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-0 z-0 w-32" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#111827"}}>
                                        <div className="flex items-center gap-1">
                                            File Type
                                            <SortIcon columnKey="filetype" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('reqdate')}
                                        title={getSortTitle("reqdate")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-32 w-48 border-r" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#111827", borderColor: border||"#e5e7eb"}}>
                                        <div className="flex items-center gap-1">
                                            Created At
                                            <SortIcon columnKey="reqdate" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('updateddate')}
                                        title={getSortTitle("updateddate")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{color: textPri||"#111827"}}>
                                        <div className="flex items-center gap-1">
                                            Updated / <br />Completed At
                                            <SortIcon columnKey="updateddate" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('status')}
                                        title={getSortTitle("status")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{color: textPri||"#111827"}}>
                                        <div className="flex items-center gap-1">
                                            Status
                                            <SortIcon columnKey="status" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{color: textPri||"#111827"}}>
                                        Total Files Uploaded
                                    </th>
                                    <th onClick={() => onSort('filecompleted')}
                                        title={getSortTitle("filecompleted")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{color: textPri||"#111827"}}>
                                        <div className="flex items-center gap-1">
                                            No. of Files Completed
                                            <SortIcon columnKey="filecompleted" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('fileerrored')}
                                        title={getSortTitle("fileerrored")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{color: textPri||"#111827"}}>
                                        <div className="flex items-center gap-1">
                                            No. of Files Errored
                                            <SortIcon columnKey="fileerrored" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y -z-0" style={{borderColor: border||"#e5e7eb"}}>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={10} className="py-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm" style={{color: textSec||"#6b7280"}}>
                                                <div className="w-5 h-5 border-2 border-t-blue-600 rounded-full animate-spin" style={{borderColor: border||"#e5e7eb", borderTopColor: accent||"#334155"}} />
                                                Loading...
                                            </div>
                                        </td>
                                    </tr>
                                ) : data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-10 text-center" style={{color: textSec||"#6b7280"}}>
                                            No data found
                                        </td>
                                    </tr>
                                ) :
                                    data?.map((item, i) => (
                                        ["PSA", "PDF"].includes(item?.filetype) &&
                                        <tr key={i} className="transition-colors" onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor="transparent"}>
                                            <td className="px-4 py-3 text-sm sticky left-0 w-32" style={{backgroundColor: bg||"#fff", color: textSec||"#6b7280"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bg||"#fff"}>
                                                {item?.filetype || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
                                            </td>
                                            <td className="
                                                    px-4 py-3 text-sm font-medium 
                                                    sticky left-32 w-48 
                                                    border-r 
                                                    whitespace-normal break-words
                                                " style={{backgroundColor: bg||"#fff", color: textPri||"#111827", borderColor: border||"#e5e7eb"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bg||"#fff"}>
                                                {formatDate(item?.reqdate) || (
                                                    <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm w-48" style={{color: textSec||"#6b7280"}}>
                                                {formatDate(item?.updateddate) || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.status || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.filecount || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.filecompleted || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.fileerrored || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
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

export default ProjectReqTable;
