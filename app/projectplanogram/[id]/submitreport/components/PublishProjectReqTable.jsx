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

const PublishProjectReqTable = ({ data, isLoading, sortConfig, onSort, theme }) => {
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => String(item?.status || "").trim().toLowerCase() !== "initial");
  }, [data]);
  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{ color: textSec || "#9ca3af" }} />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />
    ) : (
      <ArrowDown className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />
    );
  };

  const renderFileType = (val) => FILE_TYPE_MAP[val] || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>;

  if (isLoading) {
    return (
      <div className="max-h-[50vh] rounded-lg shadow-sm border overflow-hidden relative h-full flex justify-center items-center" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
        <LoadingSpinner text="Fetching requests..." />
      </div>
    );
  }

  if (!filteredData?.length) {
    return (
      <div className="max-h-[50vh] rounded-lg shadow-sm border overflow-hidden relative h-full flex justify-center items-center" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb", color: textSec || "#6b7280" }}>
        No data found
      </div>
    );
  }

  return (
    <div className="overflow-auto  min-h-[400px]">
      <table className="min-w-full border-separate border-spacing-0 rounded-lg shadow-sm" style={{ backgroundColor: bg || "#fff" }}>
        <thead className="sticky top-0 z-10 border-b" style={{ backgroundColor: bgSub || "#f9fafb", borderColor: border || "#e5e7eb" }}>
          <tr>
            <th
              onClick={() => onSort("ft")}
              className="px-4 py-3 text-left text-sm font-semibold sticky left-0 w-40 z-20"
              style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#111827" }}
            >
              <div className="flex items-center gap-1">
                File Type <SortIcon columnKey="ft" />
              </div>
            </th>
            <th
              onClick={() => onSort("reqdate")}
              className="px-4 py-3 text-left text-sm font-semibold sticky left-40 w-56 border-r z-20"
              style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#111827", borderColor: border || "#e5e7eb" }}
            >
              <div className="flex items-center gap-1">
                Created At <SortIcon columnKey="reqdate" />
              </div>
            </th>
            <th
              onClick={() => onSort("updateddate")}
              className="px-4 py-3 text-left text-sm font-semibold w-56"
              style={{ color: textPri || "#111827" }}
            >
              <div className="flex items-center gap-1">
                Updated / Completed At <SortIcon columnKey="updateddate" />
              </div>
            </th>
            <th
              onClick={() => onSort("status")}
              className="px-4 py-3 text-left text-sm font-semibold w-40"
              style={{ color: textPri || "#111827" }}
            >
              <div className="flex items-center gap-1">
                Status <SortIcon columnKey="status" />
              </div>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y" style={{ borderColor: border || "#e5e7eb" }}>
          {filteredData.map((item, index) => (
            <tr
              key={index}
              className="transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover || "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td
                className="px-4 py-3 text-sm sticky left-0 w-40"
                style={{ backgroundColor: bg || "#fff", color: textSec || "#6b7280" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover || "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg || "#fff")}
              >
                {renderFileType(item?.ft)}
              </td>
              <td
                className="px-4 py-3 text-sm font-medium sticky left-40 w-56 border-r whitespace-normal break-words"
                style={{ backgroundColor: bg || "#fff", color: textPri || "#111827", borderColor: border || "#e5e7eb" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover || "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg || "#fff")}
              >
                {formatDate(item?.reqdate) || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
              </td>
              <td className="px-4 py-3 text-sm w-56" style={{ color: textSec || "#6b7280" }}>
                {formatDate(item?.updateddate) || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
              </td>
              <td className="px-4 py-3 text-sm w-40" style={{ color: textSec || "#6b7280" }}>
                {item?.status || <span className="text-sm" style={{ color: textSec || "#9ca3af" }}>N/A</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PublishProjectReqTable;
