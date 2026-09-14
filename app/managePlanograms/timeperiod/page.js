"use client";
/* eslint-disable */
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/app/components/layout/AppLayout";
import TimePeriodTable from "@/app/components/table/TimePeriodTable";
import AddTimePeriodModal from "@/app/components/modal/AddTimePeriodModal";
import { lambdaGet } from "@/app/lamda/lambdaClient";

export default function ManageTimeperiodPage() {
  const [timePeriodData, setTimePeriodData] = useState([]);
  const [timePeriodLoading, setTimePeriodLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTimePeriod = useMemo(() => {
    let filtered = timePeriodData;
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        const numericColumns = ["prodCount", "storeCount", "pogCount"];
        if (numericColumns.includes(sortConfig.key)) {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [timePeriodData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  };

  const totalRows = filteredTimePeriod?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredTimePeriod?.slice(startIndex, endIndex) || [];

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const fetchTimePeriod = async () => {
    setTimePeriodLoading(true);
    try {
      const data = await lambdaGet(`/gettimeperiod`);
      setTimePeriodData(data?.[0]?.period || data?.period || []);
    } catch (error) {
      console.error("Error fetching Time Period:", error);
      setTimePeriodData([]);
    } finally {
      setTimePeriodLoading(false);
    }
  };

  useEffect(() => {
    fetchTimePeriod();
  }, []);

  return (
    <AppLayout>
      <div className="relative h-full flex flex-col text-gray-600">
        <div className="flex flex-col w-full sticky top-0 z-10 pt-1 mb-2">
          <div className="flex justify-between">
            <AddTimePeriodModal fetchTimePeriod={fetchTimePeriod} />
          </div>
        </div>
        <TimePeriodTable data={paginatedData} isLoading={timePeriodLoading} sortConfig={sortConfig} onSort={handleSort} />
        {timePeriodData?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select value={rowsPerPage} onChange={(e) => handleRowsPerPageChange(Number(e.target.value))} className="cursor-pointer border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 ml-4">Showing {totalRows > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalRows)} of {totalRows}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">Page {totalRows > 0 ? currentPage : 0} of {totalPages || 0}</span>
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="First page">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1 || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="Last page">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
