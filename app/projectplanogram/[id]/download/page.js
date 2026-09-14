'use client'
import DownloadTable from "./components/DownloadTable";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCcw } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/app/components/layout/AppLayout";
import { useProject } from "@/app/hooks/useProject";

const Page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [extractFilesData, setExtractFilesData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50)

  const params = useParams()
  const { retailerId } = useProject();
  // CCBU uses retailerId-aware API: /getextractfile/{retailerId}/{id} with fallback
  const id = params?.id;

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
    if (!params?.id) return;
    fetchExtractFiles();
  }, [params?.id, retailerId]);


  async function fetchExtractFiles() {
    
    try {
      setIsLoading(true)
      // Use retailer-aware endpoint when available, preserve CCBU data flow
      const path = retailerId ? `/getextractfile/${retailerId}/${params?.id}` : `/getextractfile/${params?.id}`;
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
    <div className="relative w-full h-full flex flex-col text-gray-600">
      <div className="flex justify-end items-center mb-2 p-2">
        <button
          onClick={() => fetchExtractFiles()}
          className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:hover:bg-blue-500"
        >
          <RefreshCcw
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          {isLoading ? "Reloading..." : "Reload"}
        </button>
      </div>
      <DownloadTable
        data={paginatedData}
        isLoading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}

      />

      {!isLoading && extractFilesData?.length > 0 && (
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="cursor-pointer border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 ml-4">
                Showing {totalRows > 0 ? startIndex + 1 : 0}–
                {Math.min(endIndex, totalRows)} of {totalRows}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">
                Page {totalRows > 0 ? currentPage : 0} of {totalPages || 0}
              </span>

              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="First page"
              >
                <ChevronsLeft className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5 text-gray-600" />
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
