'use client'
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/app/components/layout/AppLayout";
import Modal from "./components/Modal";
import MissingStoreTable from "./components/MissingStoreTable";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import AdditionalStoreTable from "./components/AdditionalStoreTable";
import { useProject } from "@/app/hooks/useProject";

const Page = () => {


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
  const params = useParams()

  const { id } = params;
  const { retailerId } = useProject();

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
  }, [id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const data = await lambdaGet(`/projecttotals/${id}`);
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
      const data = await lambdaGet(`/getvalidation/${id}`);
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
      const data = await lambdaGet(`/getvalidationmessage/${retailerId}/${id}/val1`);
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
      const data = await lambdaGet(`/getvalidationmessage/${retailerId}/${id}/${val}`);
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
        <div className="bg-white rounded-2xl shadow-md p-4 h-36">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Total Planograms</h3>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
          ) : (
            <p className="text-4xl text-gray-700 font-medium">
              {data?.totalplanograms ?? "N/A"}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Total Products</h3>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
          ) : (
            <p className="text-4xl text-gray-700 font-medium">
              {data?.totalproducts ?? "N/A"}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Total Stores</h3>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
          ) : (
            <p className="text-4xl text-gray-700 font-medium">
              {data?.totalstores ?? "N/A"}
            </p>
          )}
        </div>
      </div>


      <div className="w-full bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Validation Status</h2>
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
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
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
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                    >
                      Download Error Report
                    </button>
                  ) : status === 'warning' ? (
                    <button
                      onClick={() => warBtnClck(filePath)}
                      className="text-xs text-yellow-700 underline hover:text-yellow-800 cursor-pointer"
                    >
                      Show Report
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-gray-500 text-sm italic py-6 text-center">
            No validation messages available.
          </div>
        )}
      </div>
      <Modal
        isOpen={visible}
        onClose={() => setVisible(false)}
        maxWidth="max-w-5xl"
        maxHeight="h-[600px]"
      >
        <div className="flex flex-col h-[500px]">
          <div className="flex justify-between items-center border-b px-6 py-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Missing Planograms Report
            </h2>

          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 bg-white">
            {tableLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600 mb-3"
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
                data={paginatedData}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ) : (

              <div className="text-center text-gray-500 italic py-10">
                No missing planogram data available.
              </div>
            )}
          </div>

          {!tableLoading && missingData?.length > 0 && (
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
                    {searchTerm && ` (filtered from ${projectList.length})`}
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
      </Modal>

      <Modal
        isOpen={visible2}
        onClose={() => setVisible2(false)}
        maxWidth="max-w-5xl"
        maxHeight="h-[600px]"
      >
        <div className="flex flex-col h-[500px]">
          <div className="flex justify-between items-center border-b px-6 py-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Additionl Planograms Report
            </h2>

          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 bg-white">
            {tableLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                  className="animate-spin h-6 w-6 text-blue-600 mb-3"
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
                data={paginatedData2}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ) : (

              <div className="text-center text-gray-500 italic py-10">
                No additional planogram data available.
              </div>
            )}
          </div>

          {!tableLoading && additionalData?.length > 0 && (
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
                    Showing {totalRows2 > 0 ? startIndex2 + 1 : 0}–
                    {Math.min(endIndex2, totalRows2)} of {totalRows2}
                    {searchTerm && ` (filtered from ${projectList.length})`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 mr-2">
                    Page {totalRows2 > 0 ? currentPage : 0} of {totalPages2 || 0}
                  </span>

                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || totalPages2 === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="First page"
                  >
                    <ChevronsLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || totalPages2 === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages2, prev + 1))}
                    disabled={currentPage === totalPages2 || totalPages2 === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Next page"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages2)}
                    disabled={currentPage === totalPages2 || totalPages2 === 0}
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
      </Modal>


    </div>
    </AppLayout>
  )
};

export default Page;
