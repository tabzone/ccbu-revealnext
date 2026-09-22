'use client'
import DownloadTable from "./components/DownloadTable";
import useAppTheme from "@/app/hooks/useAppTheme";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCcw } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/app/components/layout/AppLayout";
const Page = () => {
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;
  const [isLoading, setIsLoading] = useState(false)
  const [extractFilesData, setExtractFilesData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50)

  const { retailerId, projectId } = useParams();
  // CCBU uses retailerId-aware API: /getextractfile/{retailerId}/{id} with fallback

  const filteredExtractFiles = useMemo(() => {
    let filtered = extractFilesData;

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];



        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;


        const numericColumns = ['prodCount', 'storeCount', 'pogCount'];
        if (numericColumns.includes(sortConfig.key)) {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase();
        }
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [extractFilesData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key !== key) {
        return { key, direction: 'asc' };
      } else if (prevConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      } else {
        return { key: null, direction: '' };
      }
    });
  }

  const totalRows = filteredExtractFiles?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredExtractFiles?.slice(startIndex, endIndex) || [];

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };


  useEffect(() => {
    if (!projectId) return;
    fetchExtractFiles();
  }, [projectId, retailerId]);


  async function fetchExtractFiles() {
    
    try {
      setIsLoading(true)
      // Use retailer-aware endpoint when available, preserve CCBU data flow
      const path = retailerId ? `/getextractfile/${retailerId}/${projectId}` : `/getextractfile/${projectId}`;
      const data = await lambdaGet(path);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setExtractFilesData(data?.data);

    } catch (err) {
      console.log(err);

    } finally {
      setIsLoading(false);
    }
  }


  return (
    <AppLayout>
    <div className="relative w-full h-full flex flex-col" style={{ backgroundColor: th.bg, color: th.textSec }}>
      <div className="flex justify-end items-center mb-2 p-2">
        <button
          onClick={() => fetchExtractFiles()}
          className="cursor-pointer flex items-center gap-2 px-4 py-1.5 text-white rounded-full shadow-sm transition disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: th.accent }}
        >
          <RefreshCcw
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          {isLoading ? "Reloading..." : "Reload"}
        </button>
      </div>
      <DownloadTable
        theme={th}
        data={paginatedData}
        isLoading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}

      />

      {!isLoading && extractFilesData?.length > 0 && (
        <div className="border-t px-4 py-3" style={{ backgroundColor: th.bgSub, borderColor: th.border }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: th.textPri }}>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="cursor-pointer border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2" style={{ borderColor: th.border, backgroundColor: th.bg, color: th.textPri }}
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm ml-4" style={{ color: th.textSec }}>
                Showing {totalRows > 0 ? startIndex + 1 : 0}–
                {Math.min(endIndex, totalRows)} of {totalRows}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm mr-2" style={{ color: th.textSec }}>
                Page {totalRows > 0 ? currentPage : 0} of {totalPages || 0}
              </span>

              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                title="First page"
              >
                <ChevronsLeft className="w-5 h-5" style={{ color: th.textSec }} />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: th.textSec }} />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" style={{ color: th.textSec }} />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5" style={{ color: th.textSec }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  )
};

export default Page;
