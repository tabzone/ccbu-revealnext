'use client'
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/app/components/layout/AppLayout";
import Modal from "./components/Modal";
import MissingStoreTable from "./components/MissingStoreTable";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import AdditionalStoreTable from "./components/AdditionalStoreTable";
import useAppTheme from "@/app/hooks/useAppTheme";

const Page = () => {
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;


  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState(false)
  const [validationLoading, setValidationLoading] = useState(false)
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false)
  const [visible2, setVisible2] = useState(false)
  const [tableLoading, setTableloading] = useState(false)
  const [missingData, setMissingData] = useState([])
  const [additionalData, setAdditionalData] = useState([])
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const { retailerId, projectId } = useParams();

  // missing store data filter
  const filteredProjects = React.useMemo(() => {

    let filtered = missingData;

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = missingData.filter(item => {
        return (
          item?.projName?.toLowerCase().includes(lowerSearchTerm) ||
          item?.co?.toLowerCase().includes(lowerSearchTerm) ||
          item?.projectTime?.toLowerCase().includes(lowerSearchTerm) ||
          item?.setStatus?.toString().toLowerCase().includes(lowerSearchTerm)
        );
      });
    }

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
  }, [missingData, searchTerm, sortConfig]);


  const totalRows = filteredProjects?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredProjects?.slice(startIndex, endIndex) || [];

  // fallback for V3 pagination display that references projectList (kept for compatibility)
  const projectList = missingData;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, missingData, sortConfig]);

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  }

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


  const filteredAdditionalData = React.useMemo(() => {

    let filtered = additionalData;

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = additionalData.filter(item => {
        return (
          item?.projName?.toLowerCase().includes(lowerSearchTerm) ||
          item?.co?.toLowerCase().includes(lowerSearchTerm) ||
          item?.projectTime?.toLowerCase().includes(lowerSearchTerm) ||
          item?.setStatus?.toString().toLowerCase().includes(lowerSearchTerm)
        );
      });
    }

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
  }, [additionalData, searchTerm, sortConfig]);


  const totalRows2 = filteredAdditionalData?.length || 0;
  const totalPages2 = Math.ceil(totalRows2 / rowsPerPage);
  const startIndex2 = (currentPage - 1) * rowsPerPage;
  const endIndex2 = startIndex2 + rowsPerPage;
  const paginatedData2 = filteredAdditionalData?.slice(startIndex2, endIndex2) || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, additionalData, sortConfig]);





  useEffect(() => {
    fetchAllData();
    fetchValidationData()
  }, [projectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const data = await lambdaGet(`/projecttotals/${projectId}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }

      setData(data);
    } catch (err) {
      console.error(" Error fetching project data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchValidationData = async () => {
    try {
      setValidationLoading(true);
      const data = await lambdaGet(`/getvalidation/${projectId}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setValidationData(data?.data);
    } catch (err) {
      console.error(" Error fetching project data:", err);
      setError(err.message);
    } finally {
      setValidationLoading(false);
    }
  };

  const fetchValidationMissData = async (val) => {
    if (!retailerId) return;
    try {
      setTableloading(true);
      const data = await lambdaGet(`/getvalidationmessage/${retailerId}/${projectId}/val1`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }

      setMissingData(data?.data);
    } catch (err) {
      console.error(" Error fetching project data:", err);
    } finally {
      setTableloading(false);
    }
  }

  const fetchValidationAddData = async (val) => {
    if (!retailerId) return;
    try {
      setTableloading(true);
      const data = await lambdaGet(`/getvalidationmessage/${retailerId}/${projectId}/${val}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }

      setAdditionalData(data?.data);
    } catch (err) {
      console.error(" Error fetching project data:", err);
    } finally {
      setTableloading(false);
    }
  }

  const download = (filePath) => {
    if (!filePath) return;
    // V3 Download Error Report — open file path URL
    window.open(filePath, '_blank');
  };

  const warBtnClck = (val) => {
    if (val == 'val1') {
      fetchValidationMissData('val1')
      setVisible(true)
    } else if (val == 'val2') {
      fetchValidationAddData('val2')
      setVisible2(true)
    }
  }

  return (
    <AppLayout>
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div style={{ backgroundColor: th.bg, borderColor: th.border }} className="rounded-2xl shadow-md p-4 h-36 border">
          <h3 style={{ color: th.textPri }} className="text-sm font-semibold mb-2">Total Planograms</h3>
          {loading ? (
            <div style={{ backgroundColor: th.bgSub }} className="h-8 w-24 rounded-md animate-pulse" />
          ) : (
            <p style={{ color: th.textPri }} className="text-4xl font-medium">
              {data?.totalplanograms ?? "N/A"}
            </p>
          )}
        </div>

        <div style={{ backgroundColor: th.bg, borderColor: th.border }} className="rounded-2xl shadow-md p-4 border">
          <h3 style={{ color: th.textPri }} className="text-sm font-semibold mb-2">Total Products</h3>
          {loading ? (
            <div style={{ backgroundColor: th.bgSub }} className="h-8 w-24 rounded-md animate-pulse" />
          ) : (
            <p style={{ color: th.textPri }} className="text-4xl font-medium">
              {data?.totalproducts ?? "N/A"}
            </p>
          )}
        </div>

        <div style={{ backgroundColor: th.bg, borderColor: th.border }} className="rounded-2xl shadow-md p-4 border">
          <h3 style={{ color: th.textPri }} className="text-sm font-semibold mb-2">Total Stores</h3>
          {loading ? (
            <div style={{ backgroundColor: th.bgSub }} className="h-8 w-24 rounded-md animate-pulse" />
          ) : (
            <p style={{ color: th.textPri }} className="text-4xl font-medium">
              {data?.totalstores ?? "N/A"}
            </p>
          )}
        </div>
      </div>


      <div style={{ backgroundColor: th.bg, borderColor: th.border }} className="w-full rounded-2xl shadow-md p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: th.textPri }} className="text-lg font-semibold">Validation Status</h2>
          {!validationLoading && validationData?.status && (
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full
          ${validationData.status === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : validationData.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : validationData.status === 'Not Validated'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-700'
                }`}
            >
              {validationData.status === 'failed'
                ? 'Validation Failed'
                : validationData.status === 'Not Validated'
                  ? 'Not Validated'
                  : validationData.status === 'warning'
                    ? 'Validation Warning'
                    : 'Validation Success'}
            </span>
          )}
        </div>

        {validationLoading ? (
          <div className="space-y-3 animate-pulse">
            <div style={{ backgroundColor: th.bgSub }} className="h-4 rounded w-1/3"></div>
            <div style={{ backgroundColor: th.bgSub }} className="h-3 rounded w-full"></div>
            <div style={{ backgroundColor: th.bgSub }} className="h-3 rounded w-5/6"></div>
            <div style={{ backgroundColor: th.bgSub }} className="h-3 rounded w-4/6"></div>
          </div>
        ) : validationData?.messages?.length ? (
          <ul className="space-y-3">
            {validationData.messages.map((msg, i) => {
              const [messageText, filePath] = msg.split('#');
              const status = validationData.status;

              const bgStyle =
                status === 'failed'
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : status === 'warning'
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-800'
                    : status === 'Not Validated'
                      ? 'border-gray-300 bg-gray-50 text-gray-700'
                      : 'border-green-300 bg-green-50 text-green-800';

              return (
                <li
                  key={i}
                  className={`flex items-center justify-between border rounded-lg p-3 shadow-sm hover:shadow-md transition ${bgStyle}`}
                >
                  <span className="text-sm font-medium">{messageText}</span>

                  {status === 'failed' ? (
                    <button
                      onClick={() => download(filePath)}
                      style={{ backgroundColor: th.accent, color: '#fff' }}
                      className="rounded px-3 py-1 text-xs text-white hover:opacity-90 transition"
                    >
                      Download Error Report
                    </button>
                  ) : status === 'warning' ? (
                    <button
                      onClick={() => warBtnClck(filePath)}
                      className="text-xs underline cursor-pointer"
                      style={{ color: isDark ? '#facc15' : '#a16207' }}
                    >
                      Show Report
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{ color: th.textSec }} className="text-sm italic py-6 text-center">
            No validation messages available.
          </div>
        )}
      </div>
      <Modal
        theme={th}
        isOpen={visible}
        onClose={() => setVisible(false)}
        maxWidth="max-w-5xl"
        maxHeight="h-[600px]"
      >
        <div className="flex flex-col h-[500px]">
          <div style={{ borderColor: th.border }} className="flex justify-between items-center border-b px-6 py-3">
            <h2 style={{ color: th.textPri }} className="text-lg font-semibold">
              Missing Planograms Report
            </h2>

          </div>

          <div style={{ backgroundColor: th.bg }} className="flex-1 overflow-y-auto px-4 py-3">
            {tableLoading ? (
              <div style={{ color: th.textSec }} className="flex flex-col items-center justify-center h-full">
                <svg
                  className="animate-spin h-6 w-6 mb-3"
                  style={{ color: th.accent }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                <p className="text-sm">Loading missing store data...</p>
              </div>
            ) : missingData?.length > 0 ? (
              <MissingStoreTable
                theme={th}
                data={paginatedData}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ) : (

              <div style={{ color: th.textSec }} className="text-center italic py-10">
                No missing planogram data available.
              </div>
            )}
          </div>

          {!tableLoading && missingData?.length > 0 && (
            <div style={{ backgroundColor: th.bgSub, borderColor: th.border }} className="border-t px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span style={{ color: th.textPri }} className="text-sm">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                    style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textPri }}
                    className="cursor-pointer border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span style={{ color: th.textSec }} className="text-sm ml-4">
                    Showing {totalRows > 0 ? startIndex + 1 : 0}–
                    {Math.min(endIndex, totalRows)} of {totalRows}
                    {searchTerm && ` (filtered from ${projectList.length})`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ color: th.textSec }} className="text-sm mr-2">
                    Page {totalRows > 0 ? currentPage : 0} of {totalPages || 0}
                  </span>

                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || totalPages === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="First page"
                  >
                    <ChevronsLeft style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || totalPages === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Previous page"
                  >
                    <ChevronLeft style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Next page"
                  >
                    <ChevronRight style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Last page"
                  >
                    <ChevronsRight style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </Modal>

      <Modal
        theme={th}
        isOpen={visible2}
        onClose={() => setVisible2(false)}
        maxWidth="max-w-5xl"
        maxHeight="h-[600px]"
      >
        <div className="flex flex-col h-[500px]">
          <div style={{ borderColor: th.border }} className="flex justify-between items-center border-b px-6 py-3">
            <h2 style={{ color: th.textPri }} className="text-lg font-semibold">
              Additionl Planograms Report
            </h2>

          </div>

          <div style={{ backgroundColor: th.bg }} className="flex-1 overflow-y-auto px-4 py-3">
            {tableLoading ? (
              <div style={{ color: th.textSec }} className="flex flex-col items-center justify-center h-full">
                <svg
                  className="animate-spin h-6 w-6 mb-3"
                  style={{ color: th.accent }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                <p className="text-sm">Loading additional store data...</p>
              </div>
            ) : additionalData?.length > 0 ? (
              <AdditionalStoreTable
                theme={th}
                data={paginatedData2}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ) : (

              <div style={{ color: th.textSec }} className="text-center italic py-10">
                No additional planogram data available.
              </div>
            )}
          </div>

          {!tableLoading && additionalData?.length > 0 && (
            <div style={{ backgroundColor: th.bgSub, borderColor: th.border }} className="border-t px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span style={{ color: th.textPri }} className="text-sm">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                    style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textPri }}
                    className="cursor-pointer border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span style={{ color: th.textSec }} className="text-sm ml-4">
                    Showing {totalRows2 > 0 ? startIndex2 + 1 : 0}–
                    {Math.min(endIndex2, totalRows2)} of {totalRows2}
                    {searchTerm && ` (filtered from ${projectList.length})`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span style={{ color: th.textSec }} className="text-sm mr-2">
                    Page {totalRows2 > 0 ? currentPage : 0} of {totalPages2 || 0}
                  </span>

                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || totalPages2 === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="First page"
                  >
                    <ChevronsLeft style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || totalPages2 === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Previous page"
                  >
                    <ChevronLeft style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages2, prev + 1))}
                    disabled={currentPage === totalPages2 || totalPages2 === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Next page"
                  >
                    <ChevronRight style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages2)}
                    disabled={currentPage === totalPages2 || totalPages2 === 0}
                    style={{ color: th.textSec }}
                    className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = th.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Last page"
                  >
                    <ChevronsRight style={{ color: th.textSec }} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>


    </div>
    </AppLayout>
  )
};

export default Page;
