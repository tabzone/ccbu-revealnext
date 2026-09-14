"use client";
import React, { useEffect, useState } from "react";
import ToggleButton from "../toggle/ToggleButton";
import { lambdaPost } from "@/app/lamda/lambdaClient";

function ArrowUpDown({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3v18M8 7l4-4 4 4M16 17l-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowUp({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowDown({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TimePeriodTable = ({ data, isLoading, sortConfig, onSort }) => {
  const [tableData, setTableData] = useState(data || []);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!data) return;
    let defaultCount = data.filter((d) => d.isDefault === 1).length;
    if (defaultCount === 0 && data.length > 0) {
      data[0].isDefault = 1;
    }
    if (defaultCount > 1) {
      let foundFirst = false;
      data.forEach((row) => {
        if (row.isDefault === 1) {
          if (!foundFirst) foundFirst = true;
          else row.isDefault = 0;
        }
      });
    }
    setTableData([...data]);
  }, [data]);

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig?.key === columnKey && sortConfig.direction;
    if (!isActive) return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-4 h-4 text-blue-600 cursor-pointer" />;
    return <ArrowDown className="w-4 h-4 text-blue-600 cursor-pointer" />;
  };

  const getSortTitle = (columnKey) => {
    if (sortConfig.key !== columnKey) return "Click to sort";
    if (!sortConfig.direction) return "Sorting cancelled";
    return sortConfig.direction === "desc" ? "Descending" : "Ascending";
  };

  const handleActiveToggle = async (item, newState, onRevert) => {
    setUpdating((prev) => ({ ...prev, [item.dis]: true }));
    const payload = {
      type: "ACTIVE",
      timeperiod: item?.timeperiod || item?.dis,
      isDefault: item?.isDefault ?? 0,
      isActive: newState ? 1 : 0,
      sortOrder: item?.sortOrder ?? 0,
      currentIndex: "",
      previousIndex: "",
    };
    try {
      const res = await lambdaPost("/updatetimeperiod", payload);
      if (res?.status === "Ok") console.log(`Time period ${newState ? "Activated" : "Deactivated"} Successfully`);
    } catch (error) {
      console.error("Error updating Active:", error);
      onRevert();
    } finally {
      setUpdating((prev) => ({ ...prev, [item.dis]: false }));
    }
  };

  const handleDefaultToggle = async (item, newState, onRevert) => {
    try {
      if (!newState) return;
      setUpdating((prev) => ({ ...prev, [item.dis + "-default"]: true }));
      setTableData((prev) => prev.map((row) => (row.dis === item.dis ? { ...row, isDefault: 1 } : { ...row, isDefault: 0 })));
      const payload = {
        type: "DEFAULT",
        timeperiod: item?.timeperiod || item?.dis,
        isDefault: 1,
        isActive: item?.isActive ?? 0,
        sortOrder: item?.sortOrder ?? 0,
        currentIndex: "",
        previousIndex: "",
      };
      const res = await lambdaPost("/updatetimeperiod", payload);
      if (res?.status === "Ok") console.log("Default time period updated Successfully");
    } catch (error) {
      console.error("Error updating Default:", error);
      onRevert();
      setTableData(data);
    } finally {
      setUpdating((prev) => ({ ...prev, [item.dis + "-default"]: false }));
    }
  };

  return (
    <div className="flex-1 overflow-auto max-h-[68vh]">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative h-full">
        <div className="overflow-auto h-full">
          <div className="flex">
            <table className="border-separate border-spacing-0 rounded-lg shadow-sm bg-white min-w-[400px] w-auto">
              <thead className="bg-gray-50 border-b border-gray-200 shadow sticky top-0 z-[1]">
                <tr>
                  <th onClick={() => onSort("isActive")} title={getSortTitle("isActive")} className="px-6 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-[200px]">
                    <div className="flex items-center gap-1">Time Period <SortIcon columnKey="isActive" /></div>
                  </th>
                  <th onClick={() => onSort("isDefault")} title={getSortTitle("isDefault")} className="px-6 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-[250px] border-l border-gray-200">
                    <div className="flex items-center gap-1">Options <SortIcon columnKey="isDefault" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="50" className="h-[250px] text-center"><div className="animate-pulse text-gray-500">Loading...</div></td></tr>
                ) : data?.length === 0 ? (
                  <tr><td colSpan="50" className="text-center py-10">No data found</td></tr>
                ) : tableData?.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-700 bg-white border-r border-gray-200">{item?.dis || <span className="text-gray-300 text-sm">N/A</span>}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 bg-white whitespace-nowrap">
                      <div className="flex items-center justify-between w-full gap-10">
                        <div className="flex justify-end">
                          <ToggleButton enabled={item.isActive === 1} onChange={(newState, revert) => handleActiveToggle(item, newState, revert)} activeLabel="Active" inactiveLabel="Inactive" />
                        </div>
                        <div className="flex items-start gap-4">
                          <ToggleButton enabled={item?.isDefault === 1} disabled={item?.isDefault === 1 || !!updating[item.dis + "-default"]} onChange={(newState, revert) => handleDefaultToggle(item, newState, revert)} activeLabel="Default" inactiveLabel="Not Default" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePeriodTable;
