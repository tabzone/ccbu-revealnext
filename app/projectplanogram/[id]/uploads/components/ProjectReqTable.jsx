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

const ProjectReqTable = ({ data, isLoading, sortConfig, onSort }) => {

    const SortIcon = ({ columnKey }) => {

        const isActive = sortConfig?.key === columnKey && sortConfig.direction;
        if (!isActive) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 text-blue-600 cursor-pointer" />;
        }
        return <ArrowDown className="w-4 h-4 text-blue-600 cursor-pointer" />;
    };


    const getSortTitle = (columnKey) => {
        if (sortConfig.key !== columnKey) return "Click to sort";
        if (!sortConfig.direction) return "Sorting cancelled";
        return sortConfig.direction === "desc" ? "Descending" : "Ascending";
    };


    return (
        <>
            <div className="flex-1 overflow-auto h-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative h-full">
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="bg-gray-50 border-b border-gray-200 shadow sticky top-0 z-[1]">
                                <tr>
                                    <th
                                        onClick={() => onSort('filetype')}
                                        title={getSortTitle("filetype")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 z-0 bg-gray-50 w-32">
                                        <div className="flex items-center gap-1">
                                            File Type
                                            <SortIcon columnKey="filetype" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('reqdate')}
                                        title={getSortTitle("reqdate")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-32 bg-gray-50 w-48 border-r border-gray-200">
                                        <div className="flex items-center gap-1">
                                            Created At
                                            <SortIcon columnKey="reqdate" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('updateddate')}
                                        title={getSortTitle("updateddate")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Updated / <br />Completed At
                                            <SortIcon columnKey="updateddate" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('status')}
                                        title={getSortTitle("status")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Status
                                            <SortIcon columnKey="status" />
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        Total Files Uploaded
                                    </th>
                                    <th onClick={() => onSort('filecompleted')}
                                        title={getSortTitle("filecompleted")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            No. of Files Completed
                                            <SortIcon columnKey="filecompleted" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('fileerrored')}
                                        title={getSortTitle("fileerrored")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            No. of Files Errored
                                            <SortIcon columnKey="fileerrored" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 -z-0">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={10} className="py-10 text-center">
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                                Loading...
                                            </div>
                                        </td>
                                    </tr>
                                ) : data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-10 text-center text-gray-500">
                                            No data found
                                        </td>
                                    </tr>
                                ) :
                                    data?.map((item, i) => (
                                        ["PSA", "PDF"].includes(item?.filetype) &&
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-600 sticky left-0 bg-white w-32 hover:bg-gray-50">
                                                {item?.filetype || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="
                                                    px-4 py-3 text-sm font-medium text-gray-900 
                                                    sticky left-32 bg-white w-48 
                                                    border-r border-gray-200 
                                              
                                                    whitespace-normal break-words hover:bg-gray-50
                                                ">
                                                {formatDate(item?.reqdate) || (
                                                    <span className="text-gray-300 text-sm">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-600 w-48">
                                                {formatDate(item?.updateddate) || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.status || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {item?.filecount || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.filecompleted || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.fileerrored || <span className="text-gray-300 text-sm">N/A</span>}
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
