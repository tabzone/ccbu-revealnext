/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/app/components/layout/AppLayout";
import ProjectStoresTable from "@/app/components/table/ProjectStoresTable";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, RefreshCcw, Upload } from "lucide-react";
import { lambdaGet, lambdaPost } from "@/app/lamda/lambdaClient";
import { toast } from "react-toastify";
import UploadStoresModal from "@/app/components/modal/UploadStoresModal";
import useAppTheme from "@/app/hooks/useAppTheme";

const CloseCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 9L15 15" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 9L9 15" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z" />
  </svg>
);
const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v13M5 10l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17h16" strokeLinecap="round" />
  </svg>
);

export default function ProjectStoresPage() {
  const { retailerId, projectId } = useParams();
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;
  const [projectTotalData, setProjectTotalData] = useState(null);
  const [projectTotalLoading, setProjectTotalLoading] = useState(true);
  const [projectStoreData, setProjectStoreData] = useState([]);
  const [projectStoreLoading, setProjectStoreLoading] = useState(false);
  const [filterData, setFilterData] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [activeHierarchy, setActiveHierarchy] = useState('region');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [updateReqData, setUpdateReqData] = useState();
  const [updtReqLoading, setUpdtReqLoading] = useState(false);
  const [createReqData, setCreateReqData] = useState();
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);

  const hierarchyItems = useMemo(() => {
    const groups = new Map();
    for (const item of Array.isArray(filterData) ? filterData : []) {
      const title = String(item?.title ?? "").trim();
      const key = title.toLowerCase().replace(/\s+/g, "");
      const count = Number(item?.count) || 0;
      const existingItem = groups.get(key);
      if (existingItem) existingItem.count += count;
      else groups.set(key, { ...item, title, count });
    }
    return Array.from(groups.values());
  }, [filterData]);

  const filteredProjectStoresTable = useMemo(() => {
    let filtered = Array.isArray(projectStoreData) ? [...projectStoreData] : [];
    if (selectedFilter !== null) {
      const normFilter = String(selectedFilter || "").trim().toLowerCase().replace(/\s+/g, '');
      if (activeHierarchy === "region") {
        filtered = filtered.filter(row => String(row?.region ?? "").trim().toLowerCase().replace(/\s+/g, '') === normFilter);
      } else if (activeHierarchy === "division") {
        filtered = filtered.filter(row => String(row?.division ?? "").trim().toLowerCase().replace(/\s+/g, '') === normFilter);
      } else if (activeHierarchy === "state") {
        filtered = filtered.filter(row => String(row?.state ?? "").trim().toLowerCase().replace(/\s+/g, '') === normFilter);
      }
    }
    if (searchTerm && searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item =>
        String(item?.storenumber ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.storeaddress1 ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.storeaddress2 ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.storecity ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.storezip ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.region ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.division ?? "").toLowerCase().includes(lowerSearchTerm) ||
        String(item?.state ?? "").toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        const bothNumeric = !isNaN(aNum) && !isNaN(bNum) && aValue !== "" && bValue !== "";
        if (bothNumeric) return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        return sortConfig.direction === "asc" ? String(aValue).localeCompare(String(bValue), undefined, { sensitivity: "base" }) : String(bValue).localeCompare(String(aValue), undefined, { sensitivity: "base" });
      });
    }
    return filtered;
  }, [projectStoreData, selectedFilter, activeHierarchy, searchTerm, sortConfig]);

  const totalRows = filteredProjectStoresTable?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredProjectStoresTable.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, rowsPerPage, selectedFilter, activeHierarchy, sortConfig, projectStoreData]);

  const handleRowsPerPageChange = (newRowsPerPage) => { setRowsPerPage(newRowsPerPage); setCurrentPage(1); };
  const handleHierarchyItemClick = (item) => {
    if (!item?.title || Number(item?.count) === 0) return;
    setSelectedFilter(item.title.trim());
    setCurrentPage(1);
  };
  const clearFilter = () => { setSelectedFilter(null); setCurrentPage(1); };
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: '' };
    });
  };

  const fetchProjectTotalData = async () => {
    try {
      setProjectTotalLoading(true);
      const data = await lambdaGet(`/projecttotals/${projectId}`);
      if (!data || data.error) { console.log(data.error); return; }
      setProjectTotalData(data);
    } catch (err) {
      console.error("Error fetching totals:", err);
      toast.error(`Totals unavailable: ${err.message}`, { position: "top-right", autoClose: 3000 });
      setProjectTotalData(null);
    } finally { setProjectTotalLoading(false); }
  };

  const fetchProjectStoreHierarchy = async (filter) => {
    if (!projectId || !retailerId) return;
    try {
      setFilterLoading(true);
      const data = await lambdaGet(`/projectstorehierarchy/${retailerId}/${projectId}/${filter}`);
      if (!data || data.error) { console.log(data.error); return; }
      setFilterData(data?.data);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      toast.error(`Hierarchy unavailable: ${err.message}`, { position: "top-right", autoClose: 3000 });
      setFilterData([]);
    } finally { setFilterLoading(false); }
  };

  const fetchProjectStore = async (filter) => {
    if (!projectId || !retailerId) return;
    try {
      setProjectStoreLoading(true);
      const data = await lambdaGet(`/${filter}/${retailerId}/${projectId}`);
      if (!data || data.error) { console.log(data.error); return; }
      setProjectStoreData(data?.data);
    } catch (err) {
      console.error("Error fetching stores:", err);
      toast.error(`Stores unavailable: ${err.message}`, { position: "top-right", autoClose: 3000 });
      setProjectStoreData([]);
    } finally { setProjectStoreLoading(false); }
  };

  const createProjRequest = async () => {
    try {
      const payload = { filetype: "PSU", projectid: projectId };
      const data = await lambdaPost("/createrequest", payload);
      setCreateReqData(data);
      return data;
    } catch (err) { console.log(err, 'error'); setCreateReqData([]); }
  };

  const updateRequest = async (projId = '', reqId = '', requestStatus = 'processing', filecount = 0, uploadType = 'CSV', filename = '', requestflow = '', basecallpoints = []) => {
    try {
      setUpdtReqLoading(true);
      const payload = { projectid: projId || projectId, requestid: reqId || createReqData?.requestid, requeststatus: requestStatus, filecount, filetype: uploadType, filename, requestflow, basecallpoints, compareid: '', isCompare: '', comparedProject: '' };
      const data = await lambdaPost("/updaterequest", payload);
      if (!data || data.error) { console.log(data.error); return; }
      setUpdateReqData(data);
    } catch (err) { console.error('Error in updateRequest:', err); setError(err.message); setUpdateReqData([]); } finally { setUpdtReqLoading(false); }
  };

  const handleHierarchyChange = (e) => {
    const value = e.target.value;
    setActiveHierarchy(value);
    setSelectedFilter(null);
    setCurrentPage(1);
    fetchProjectStoreHierarchy(value);
  };

  useEffect(() => {
    if (!projectId) return;
    fetchProjectTotalData();
    if (retailerId) fetchProjectStore('projectstores');
  }, [projectId, retailerId]);

  useEffect(() => {
    if (projectId && retailerId) fetchProjectStoreHierarchy("region");
  }, [projectId, retailerId]);

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen text-red-600">Failed to load: {error}</div>
      </AppLayout>
    );
  }

  const downloadDataFile = async (fName) => {
    try {
      toast.info("Starting download...", { position: "top-right", autoClose: 1000, hideProgressBar: true });
      const { downloadUrl } = await lambdaGet(`/downloadurl/${projectId}/${fName}`);
      const a = document.createElement("a"); a.href = downloadUrl; a.download = `${fName}.csv`; document.body.appendChild(a); a.click(); a.remove();
      toast.success("Download started!", { position: "top-right", autoClose: 1000, hideProgressBar: true });
    } catch (error) { console.error(error); toast.error("Download failed!"); }
  };

  return (
    <AppLayout>
      <div className="flex justify-between gap-4 w-full h-[98%] p-2 rounded-2xl" style={{ backgroundColor: th.bgSub }}>
        <div className="w-[20%] flex flex-col gap-3">
          <div className="w-full min-h-[160px] max-h-[160px] shadow rounded-2xl flex flex-col justify-center items-start p-4 gap-2 border" style={{ backgroundColor: th.bg, borderColor: th.border }}>
            {projectTotalLoading ? (
              <>
                <div className="w-16 h-10 rounded animate-pulse" style={{ backgroundColor: th.bgSub }}></div>
                <div className="w-20 h-4 rounded animate-pulse" style={{ backgroundColor: th.bgSub }}></div>
              </>
            ) : (
              <>
                <span className="text-4xl font-semibold" style={{ color: th.textPri }}>{projectTotalData?.totalstores || 0}</span>
                <span className="text-sm" style={{ color: th.textSec }}>Stores</span>
              </>
            )}
          </div>
          {projectTotalLoading ? (
            <div className="w-full">
              <div className="w-32 h-4 rounded mb-2 animate-pulse" style={{ backgroundColor: th.bgSub }}></div>
              <div className="w-full h-10 rounded animate-pulse" style={{ backgroundColor: th.bgSub }}></div>
            </div>
          ) : (
            <>
              <div className="w-full">
                <label className="block text-sm font-medium mb-1" style={{ color: th.textPri }}>Select Hierarchy</label>
                <select onChange={handleHierarchyChange} value={activeHierarchy} className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textPri }}>
                  <option value="region">Region</option>
                  <option value="division">Division</option>
                  <option value="state">State</option>
                </select>
              </div>
              {selectedFilter && selectedFilter !== "No Data" && (
                <div className="w-full border rounded-md px-2 py-1 flex items-center justify-between" style={{ backgroundColor: th.bgSub, borderColor: th.border }}>
                  <span className="text-sm font-medium" style={{ color: th.accent }}>Filter: {selectedFilter}</span>
                  <button onClick={clearFilter} className="cursor-pointer text-xs underline ml-2" style={{ color: th.accent }}>Clear</button>
                </div>
              )}
              <div className="w-full">
                {filterLoading ? (
                  <div className="space-y-2 mt-2">{[...Array(6)].map((_, i) => (<div key={i} className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: th.bgSub }}></div>))}</div>
                ) : hierarchyItems.length > 0 ? (
                  <ul className="text-sm space-y-1 overflow-y-auto h-64 pr-1" style={{ color: th.textSec }}>
                    {hierarchyItems.map((item, idx) => {
                      const count = Number(item?.count || 0);
                      const hasData = count > 0;
                      const label = item?.title?.trim() || "No Data";
                      const isActive = selectedFilter === label;
                      return (
                        <li key={idx} onClick={() => hasData && handleHierarchyItemClick(item)} title={!hasData ? "No data available" : ""} className={`px-2 py-1 rounded transition-colors ${hasData ? "cursor-pointer" : "cursor-not-allowed"}`} style={{ backgroundColor: isActive && hasData ? th.hover : "transparent", color: isActive && hasData ? th.accent : hasData ? th.textSec : th.textSec, opacity: !hasData ? 0.5 : 1, fontWeight: isActive && hasData ? 600 : 400 }} onMouseEnter={(e) => { if (hasData && !isActive) e.currentTarget.style.backgroundColor = th.hover; }} onMouseLeave={(e) => { if (hasData && !isActive) e.currentTarget.style.backgroundColor = "transparent"; }}>
                          {label} {hasData && `(${count})`}
                        </li>
                      );
                    })}
                  </ul>
                ) : (<p className="text-sm italic mt-2" style={{ color: th.textSec }}>No hierarchy data available</p>)}
              </div>
            </>
          )}
        </div>
        <div className="w-[79%] shadow rounded-2xl flex flex-col gap-4 p-4 border" style={{ backgroundColor: th.bg, borderColor: th.border }}>
          <div className="w-full flex justify-between">
            <button onClick={() => { setUploadModal(true); createProjRequest(); }} className="flex gap-2 items-center px-3 py-1 border rounded-full cursor-pointer transition hover:opacity-80" style={{ borderColor: th.accent, color: th.accent, backgroundColor: th.bg }}>
              <Upload className="w-4 h-4" />Upload Store Data
            </button>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-4xl px-4 py-1.5 pr-10 focus:ring-0 focus:outline-none" style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textPri }} placeholder="Store number or address" />
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-80" style={{ color: th.textSec }}><CloseCircleIcon className="w-4 h-4 cursor-pointer" /></button>
                ) : <button type="button" onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-80" style={{ color: th.textSec }}><SearchIcon className="w-4 h-4 cursor-pointer" /></button>}
              </div>
              <div className="flex gap-2">
                {projectStoreLoading && projectTotalLoading ? (
                  <><div className="w-24 h-8 rounded-full animate-pulse" style={{ backgroundColor: th.bgSub }}></div><div className="w-24 h-8 rounded-full animate-pulse" style={{ backgroundColor: th.bgSub }}></div></>
                ) : (
                  <>
                    <div className="relative h-full flex items-center z-[70]" onMouseEnter={() => setDownloadDropdownOpen(true)} onMouseLeave={() => setDownloadDropdownOpen(false)}>
                      <button className="px-4" style={{ color: th.textPri }}><DownloadIcon className="w-6 h-6 cursor-pointer" /></button>
                      {downloadDropdownOpen && (
                        <div className="absolute top-full right-0 w-48 border rounded shadow-lg z-[200]" style={{ backgroundColor: th.bg, borderColor: th.border }}>
                          <button className="w-full text-left px-4 py-2 cursor-pointer transition" style={{ color: th.textPri }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} onClick={() => downloadDataFile("STR-U")}>Unmatched Stores</button>
                          <button className="w-full text-left px-4 py-2 cursor-pointer transition" style={{ color: th.textPri }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} onClick={() => downloadDataFile("STR-M")}>Matched Stores</button>
                          <button className="w-full text-left px-4 py-2 cursor-pointer transition" style={{ color: th.textPri }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} onClick={() => downloadDataFile("STR-A")}>All Stores</button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => fetchProjectStore('projectstores')} className="flex gap-2 items-center px-3 py-1 border rounded-full cursor-pointer transition hover:opacity-80" style={{ borderColor: th.accent, color: th.accent, backgroundColor: th.bg }}>
                      <RefreshCcw className={`w-4 h-4 ${projectStoreLoading ? 'animate-spin' : ''}`} />Refresh
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <ProjectStoresTable data={paginatedData} isLoading={projectStoreLoading} sortConfig={sortConfig} onSort={handleSort} />
          </div>
          {!projectStoreLoading && projectStoreData?.length > 0 && (
            <div className="border-t px-4 py-3" style={{ backgroundColor: th.bgSub, borderColor: th.border }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: th.textPri }}>Rows per page:</span>
                  <select value={rowsPerPage} onChange={(e) => handleRowsPerPageChange(Number(e.target.value))} className="cursor-pointer border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textPri }}>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm ml-4" style={{ color: th.textSec }}>Showing {totalRows > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, totalRows)} of {totalRows}{searchTerm && ` (filtered from ${projectStoreData.length})`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm mr-2" style={{ color: th.textSec }}>Page {totalRows > 0 ? currentPage : 0} of {totalPages || 0}</span>
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || totalPages === 0} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="First page"><ChevronsLeft className="w-5 h-5" /></button>
                  <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1 || totalPages === 0} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Previous page"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Next page"><ChevronRight className="w-5 h-5" /></button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition" style={{ color: th.textSec }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = th.hover)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")} title="Last page"><ChevronsRight className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
        <UploadStoresModal
          open={uploadModal}
          setOpen={setUploadModal}
          updateRequest={updateRequest}
          createProjRequest={createProjRequest}
          fetchProjectReqList={fetchProjectStore}
          createReqData={createReqData}
          typeToUpload="files"
        />
      </div>
    </AppLayout>
  );
}
