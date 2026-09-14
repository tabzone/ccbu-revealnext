import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";

const ProjectPlanogramTables = ({ data, isLoading, sortConfig, onSort }) => {

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
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative h-full">
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-[1]">
                                <tr>
                                    <th
                                        onClick={() => onSort('pogname')}
                                        title={getSortTitle("pogname")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 z-10 bg-gray-50 w-32">
                                        <div className="flex items-center gap-1">
                                            Planogram Name
                                            {!isLoading && <SortIcon columnKey="pogname" />}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('psafile')}
                                        title={getSortTitle("psafile")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-32 bg-gray-50 w-48 border-r border-gray-200">
                                        <div className="flex items-center gap-1">
                                            Schematic File
                                            {!isLoading && <SortIcon columnKey="psafile" />}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('pogheight')}
                                        title={getSortTitle("pogheight")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Planogram Height
                                            {!isLoading && <SortIcon columnKey="pogheight" />}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('POGWidth')}
                                        title={getSortTitle("POGWidth")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Planogram Width
                                            {!isLoading && <SortIcon columnKey="POGWidth" />}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('pogstore')}
                                        title={getSortTitle("pogstore")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Store Attached
                                            {!isLoading && <SortIcon columnKey="pogstore" />}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('projectproductcount')}
                                        title={getSortTitle("projectproductcount")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Product Count
                                            {!isLoading && <SortIcon columnKey="projectproductcount" />}
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => onSort('positioncount')}
                                        title={getSortTitle("positioncount")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Position Count
                                            {!isLoading && <SortIcon columnKey="positioncount" />}
                                        </div>
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    [...Array(10)].map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(8)].map((__, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : data?.length > 0 ? (
                                    data?.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm sticky left-0 bg-white w-32">
                                                {item?.pogname || <span className="text-gray-300">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm sticky left-32 bg-white w-48 border-r border-r-gray-200">
                                                {item?.psafile || <span className="text-gray-300">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                {item?.pogheight || <span className="text-gray-300">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                {item?.POGWidth
                                                    ? `${Math.round((item.POGWidth / 12) * 100) / 100} ft (${item.POGWidth} in)`
                                                    : <span className="text-gray-300">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                {item?.pogstore || <span className="text-gray-300">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                {item?.projectproductcount || <span className="text-gray-300">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                {item?.positioncount || <span className="text-gray-300">N/A</span>}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-sm text-gray-500">
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
