import { formatDate } from "./formatters";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React, { useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";

const FILE_TYPE_MAP = {
  PRD: "Product Master Data",
  STR: "Store Master Data",
  PSA: "Schematic files",
  SUB: "Submitted File",
  PPU: "Product Update",
};

const PublishProjectReqTable = ({ data, isLoading, sortConfig, onSort }) => {
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => String(item?.status || "").trim().toLowerCase() !== "initial");
  }, [data]);
  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600 cursor-pointer" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600 cursor-pointer" />
    );
  };

  const renderFileType = (val) => FILE_TYPE_MAP[val] || <span className="text-gray-300 text-sm">N/A</span>;

  if (isLoading) {
    return (
      <div className="max-h-[50vh] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative h-full flex justify-center items-center">
        <LoadingSpinner text="Fetching requests..." />
      </div>
    );
  }

  if (!filteredData?.length) {
    return (
      <div className="max-h-[50vh] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative h-full flex justify-center items-center">
        No data found
      </div>
    );
  }

  return (
    <div className="overflow-auto  min-h-[400px]">
      <table className="min-w-full border-separate border-spacing-0 bg-white rounded-lg shadow-sm">
        <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <tr>
            <th
              onClick={() => onSort("ft")}
              className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 w-40 z-20"
            >
              <div className="flex items-center gap-1">
                File Type <SortIcon columnKey="ft" />
              </div>
            </th>
            <th
              onClick={() => onSort("reqdate")}
              className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-40 bg-gray-50 w-56 border-r border-gray-200"
            >
              <div className="flex items-center gap-1">
                Created At <SortIcon columnKey="reqdate" />
              </div>
            </th>
            <th
              onClick={() => onSort("updateddate")}
              className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-56"
            >
              <div className="flex items-center gap-1">
                Updated / Completed At <SortIcon columnKey="updateddate" />
              </div>
            </th>
            <th
              onClick={() => onSort("status")}
              className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-40"
            >
              <div className="flex items-center gap-1">
                Status <SortIcon columnKey="status" />
              </div>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {filteredData.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-600 sticky left-0 bg-white w-40">
                {renderFileType(item?.ft)}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-40 bg-white w-56 border-r border-gray-200 whitespace-normal break-words">
                {formatDate(item?.reqdate) || <span className="text-gray-300 text-sm">N/A</span>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 w-56">
                {formatDate(item?.updateddate) || <span className="text-gray-300 text-sm">N/A</span>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 w-40">
                {item?.status || <span className="text-gray-300 text-sm">N/A</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PublishProjectReqTable;
