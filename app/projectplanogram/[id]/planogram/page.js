'use client';
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/app/components/layout/AppLayout";
import ProjectPlanogramTables from "./components/ProjectPlanogramTables";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCcw } from "lucide-react";
import { CloseCircleIcon, DownloadIcon, SearchIcon } from "./components/icons";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import { toast } from "react-toastify";
import { useProject } from "@/app/hooks/useProject";
import useAppTheme from "@/app/hooks/useAppTheme";

const Page = () => {
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;
  const [projectTotalData, setProjectTotalData] = useState(null);
  const [projectTotalLoading, setProjectTotalLoading] = useState(true);
  const [filterData, setFilterData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null)
  const [tableData, setTableData] = useState([])
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [activeHierarchy, setActiveHierarchy] = useState('footage')
  const [selectedFilter, setSelectedFilter] = useState(null)


  const params = useParams();
  const { id } = params;
  const { retailerId } = useProject();

  const filteredTableData = useMemo(() => {
    let filtered = Array.isArray(tableData) ? [...tableData] : [];

    if (selectedFilter !== null) {
      const extractNumberFromTitle = (title) => {
        if (title == null) return NaN;
        const n = parseFloat(String(title).replace(/[^0-9.\-]/g, ''));
        return isNaN(n) ? NaN : n;
      };

      if (activeHierarchy === 'footage') {
        const filterFeet = extractNumberFromTitle(selectedFilter);

        if (!isNaN(filterFeet)) {
          filtered = filtered.filter(row => {
            const raw = row?.POGWidth;
            const inches = parseFloat(String(raw).replace(/[^0-9.\-]/g, ''))
            if (isNaN(inches)) return false;
            const rowFeet = inches / 12;

            return Math.floor(rowFeet) === Math.floor(filterFeet);
          });
        } else {
          const normFilter = String(selectedFilter || '').trim().toLowerCase().replace(/\s+/g, '');
          filtered = filtered.filter(row => {
            const tableVal = String(row?.POGWidth ?? '').trim().toLowerCase().replace(/\s+/g, '');
            return tableVal === normFilter;
          });
        }
      } else if (activeHierarchy === 'doorcount') {
        const filterNum = extractNumberFromTitle(selectedFilter);
        if (!isNaN(filterNum)) {
          filtered = filtered.filter(row => {
            const rc = row?.DoorCount;
            const rowNum = Number(rc);
            return !isNaN(rowNum) && rowNum === filterNum;
          });
        } else {
          const normFilter = String(selectedFilter || '').trim().toLowerCase().replace(/\s+/g, '');
          filtered = filtered.filter(row => {
            const tableVal = String(row?.DoorCount ?? '').trim().toLowerCase().replace(/\s+/g, '');
            return tableVal === normFilter;
          });
        }
      }
    }

    if (searchTerm && searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        return (
          String(item?.psafile ?? '').toLowerCase().includes(lowerSearchTerm)
        );
      });
    }

    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const numericColumns = ['prodCount', 'storeCount', 'pogCount', 'projectproductcount', 'positioncount'];
        if (numericColumns.includes(sortConfig.key)) {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [tableData, selectedFilter, activeHierarchy, searchTerm, sortConfig]);

  const totalRows = filteredTableData?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredTableData.slice(startIndex, endIndex);

  // rest page when dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, selectedFilter, activeHierarchy, sortConfig, tableData]);


  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

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
  
  const handleHierarchyChange = (e) => {
    const value = e.target.value;
    setActiveHierarchy(value);
    setSelectedFilter(null);
    if (value === "footage") {
      fetchProjectPlanogramHierarchy("POGWidth");
    } else if (value === "doorcount") {
      fetchProjectPlanogramHierarchy("DoorCount");
    }
  };

  const handleHierarchyItemClick = (item) => {
    if (!item) return;
    setSelectedFilter(item.title ?? item);
    setCurrentPage(1);
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!id || !retailerId) return;
    fetchProjectTotalData();
    getProjectPlanograms();
    fetchProjectPlanogramHierarchy("POGWidth");
  }, [id, retailerId]);

  const fetchProjectTotalData = async () => {
    try {
      setProjectTotalLoading(true);
      const data = await lambdaGet(`/projecttotals/${id}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setProjectTotalData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch project totals');
    } finally {
      setProjectTotalLoading(false);
    }
  };

  const fetchProjectPlanogramHierarchy = async (filter) => {
    if (!id || !retailerId) return;
    try {
      setFilterLoading(true);
      const data = await lambdaGet(`/projectplanogramhierarchy/${retailerId}/${id}/${filter}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setFilterData(data?.data ?? []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch hierarchy');
    } finally {
      setFilterLoading(false);
    }
  };
  const getProjectPlanograms = async () => {
    if (!id || !retailerId) return;
    try {
      setTableLoading(true);
      const data = await lambdaGet(`/projectplanogramsv1/${retailerId}/${id}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setTableData(data?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  const downloadDataFile = async () => {
    try {
      toast.info("Starting download...", {
        position: "top-right",
        autoClose: 500,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      if (!id) throw new Error("Missing project id");
      const res = await lambdaGet(`/downloadurl/${id}/POG`);
      const downloadUrl =
        res?.downloadUrl || res?.url || res?.data?.downloadUrl || res?.data?.url || (typeof res === "string" ? res : null);
      if (!downloadUrl || typeof downloadUrl !== "string" || !/^https?:\/\//.test(downloadUrl)) {
        throw new Error(res?.message || "Download URL not available");
      }

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${'POG'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success("Download started!", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error(error);
      toast.error(error?.message ? `Download failed: ${error.message}` : "Download failed!");
    }
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen text-red-600">
          Failed to load: {error}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="flex justify-between gap-4 w-full h-[98%] p-2 rounded-2xl" style={{ backgroundColor: bgSub }}>
      <div className="w-[20%] flex flex-col gap-3">
        <div className="w-full max-h-[120px] min-h-[120px] shadow rounded-2xl flex flex-col justify-center items-start p-4 gap-2" style={{ backgroundColor: bg, borderColor: border, borderWidth: "1px" }}>
          {projectTotalLoading ? (
            <>
              <div className="w-16 h-8 rounded animate-pulse" style={{ backgroundColor: bgSub }}></div>
              <div className="w-24 h-4 rounded animate-pulse" style={{ backgroundColor: bgSub }}></div>
            </>
          ) : (
            <>
              <span className="text-4xl font-semibold" style={{ color: textPri }}>
                {projectTotalData?.totalplanograms || 0}
              </span>
              <span className="text-sm" style={{ color: textSec }}>Planograms</span>
            </>
          )}
        </div>
        <div className="w-full flex-1 shadow rounded-2xl flex flex-col items-start p-4 gap-4" style={{ backgroundColor: bg, borderColor: border, borderWidth: "1px" }}>
          {projectTotalLoading ? (
            <>
              <div className="w-full">
                <div className="w-28 h-4 rounded animate-pulse mb-2" style={{ backgroundColor: bgSub }}></div>
                <div className="w-full h-9 rounded animate-pulse" style={{ backgroundColor: bgSub }}></div>
              </div>
              <div className="w-full mt-2">
                <div className="w-full h-6 rounded animate-pulse" style={{ backgroundColor: bgSub }}></div>
              </div>
              <ul className="w-full space-y-2 mt-2">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="w-full h-4 rounded animate-pulse" style={{ backgroundColor: bgSub }}></li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div className="w-full">
                <label className="block text-sm font-medium mb-1" style={{ color: textSec }}>Select Hierarchy</label>
                <select
                  onChange={handleHierarchyChange}
                  value={activeHierarchy}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: bg, borderColor: border, color: textPri }}
                >
                  <option value="footage">Footage</option>
                  <option value="doorcount">Door Count</option>
                </select>
              </div>

              {selectedFilter && selectedFilter !== "No Data" && (
                <div className="w-full rounded-md px-2 py-1 flex items-center justify-between animate-fadeIn" style={{ backgroundColor: isDark ? `${accent}22` : "#eff6ff", borderColor: isDark ? accent : "#bfdbfe", borderWidth: "1px" }}>
                  <span className="text-sm font-medium" style={{ color: isDark ? textPri : "#1d4ed8" }}>
                    Filter: {selectedFilter}
                  </span>
                  <button
                    onClick={clearFilter}
                    className="cursor-pointer text-xs underline ml-2"
                    style={{ color: accent }}
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="w-full">
                {filterLoading ? (
                  <div className="space-y-2 mt-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: bgSub }}></div>
                    ))}
                  </div>
                ) : filterData?.length > 0 ? (
                  <ul className="text-sm space-y-1 overflow-y-auto h-64 pr-1" style={{ color: textSec }}>
                    {Array.isArray(filterData) ?
                      (filterData?.map((item, idx) => {
                        const count = Number(item?.count || 0);
                        const hasData = count > 0;
                        const label = item?.title?.trim() || "No Data";
                        const isActive = selectedFilter === label;

                        return (
                          <li
                            key={idx}
                            onClick={() => hasData && handleHierarchyItemClick(item)}
                            title={!hasData ? "No data available" : ""}
                            className={`px-2 py-1 rounded transition-colors ${hasData
                              ? "cursor-pointer"
                              : "cursor-not-allowed"
                              } ${isActive && hasData
                                ? "font-semibold"
                                : ""
                              }`}
                            style={isActive && hasData ? { backgroundColor: hover, color: accent } : hasData ? { color: textSec } : { color: textSec, opacity: 0.5 }}
                            onMouseEnter={(e) => { if (hasData && !isActive) e.currentTarget.style.backgroundColor = hover; }}
                            onMouseLeave={(e) => { if (hasData && !isActive) e.currentTarget.style.backgroundColor = ""; }}
                          >
                            {label} {hasData && `(${count})`}
                          </li>
                        );
                      })) :
                      <div>No data available</div>
                    }
                  </ul>
                ) : (
                  <p className="text-sm italic mt-2" style={{ color: textSec }}>
                    No hierarchy data available
                  </p>
                )}
              </div>

            </>
          )}
        </div>

      </div>

      <div className="w-[79%] shadow rounded-2xl flex flex-col gap-4 p-4" style={{ backgroundColor: bg, borderColor: border, borderWidth: "1px" }}>
        <div className="flex flex-wrap justify-between gap-4 relative">
          <div className="w-40 h-24 shadow-sm rounded-2xl flex flex-col justify-center items-start p-4 gap-1" style={{ backgroundColor: bgSub, borderColor: border, borderWidth: "1px" }}>
            {projectTotalLoading ? (
              <>
                <div className="w-16 h-7 rounded animate-pulse" style={{ backgroundColor: isDark ? border : "#e5e7eb" }}></div>
                <div className="w-20 h-4 rounded animate-pulse" style={{ backgroundColor: isDark ? border : "#e5e7eb" }}></div>
              </>
            ) : (
              <>
                <span className="text-3xl font-semibold" style={{ color: textPri }}>
                  {projectTotalData?.totalpogfootage || 0}
                </span>
                <span className="text-sm" style={{ color: textSec }}>Footage</span>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3">

            <div className="flex items-end">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-2 rounded-full px-4 py-1.5 pr-10 shadow-sm focus:ring-0 focus:outline-none"
                  style={{ backgroundColor: bg, borderColor: border, color: textPri }}
                  placeholder="Search Schematic Files..."
                />

                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    style={{ color: textSec }}
                  >
                    <CloseCircleIcon className="w-4 h-4 cursor-pointer" style={{ color: textSec }} />
                  </button>
                ) : <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  style={{ color: textSec }}
                >
                  <SearchIcon className="w-4 h-4 cursor-pointer" style={{ color: textSec }} />
                </button>}
              </div>

            </div>

            <div className="flex items-end gap-2">
              {projectTotalLoading ? (
                <>
                  <div className="w-24 h-8 rounded-full animate-pulse" style={{ backgroundColor: bgSub }}></div>
                  <div className="w-24 h-8 rounded-full animate-pulse" style={{ backgroundColor: bgSub }}></div>
                </>
              ) : (
                <>
                  <button
                    onClick={downloadDataFile}
                    className="px-4 py-1.5 border rounded-full cursor-pointer transition hover:opacity-80"
                    style={{ borderColor: border, color: accent, backgroundColor: bg }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
                  >
                    <DownloadIcon className={`w-5 h-5`} />
                  </button>

                  <button
                    onClick={getProjectPlanograms}
                    className="flex gap-2 items-center px-4 py-1.5 border rounded-full cursor-pointer transition hover:opacity-80"
                    style={{ borderColor: border, color: accent, backgroundColor: bg }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
                  >
                    <RefreshCcw className={`w-5 h-5   ${tableLoading ? 'animate-spin' : ''}`} />
                  </button>
                </>
              )}
            </div>

          </div>

        </div>


        <div className="flex flex-col gap-2 flex-1">
          <div className="overflow-auto max-h-[55vh] border rounded-lg" style={{ borderColor: border, backgroundColor: bg }}>
            <ProjectPlanogramTables
        theme={th}
              data={paginatedData}
              isLoading={tableLoading}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>

          {totalRows > 0 ? (
            <div className="rounded-lg shadow-sm border px-4 py-3 flex items-center justify-between" style={{ backgroundColor: bg, borderColor: border }}>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: textPri }}>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  className="cursor-pointer border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2"
                  style={{ backgroundColor: bg, borderColor: border, color: textPri }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm ml-4" style={{ color: textSec }}>
                  Showing {totalRows > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalRows)} of {totalRows}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm mr-2" style={{ color: textSec }}>Page {currentPage} of {totalPages}</span>

                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={{ color: textSec }} onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = hover; }} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                  <ChevronsLeft className="w-5 h-5" style={{ color: textSec }} />
                </button>
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={{ color: textSec }} onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = hover; }} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                  <ChevronLeft className="w-5 h-5" style={{ color: textSec }} />
                </button>
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={{ color: textSec }} onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = hover; }} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                  <ChevronRight className="w-5 h-5" style={{ color: textSec }} />
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" style={{ color: textSec }} onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = hover; }} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                  <ChevronsRight className="w-5 h-5" style={{ color: textSec }} />
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center" style={{ color: textSec }}>No rows to display</div>
          )}
        </div>
      </div>

    </div>
    </AppLayout>
  );
};

export default Page;
