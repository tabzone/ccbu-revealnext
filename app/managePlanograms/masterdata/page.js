'use client'
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import CreateProjectModal from "@/app/components/modal/CreateProjectModal";
import ProjectsTable from "@/app/components/table/ProjectsTable";
import { ReloadIcon, SearchIcon, CloseCircleIcon, ArrowLeftIcon, ArrowRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@/data/icons";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import AppLayout from "@/app/components/layout/AppLayout";

const STORAGE_KEY = "manageReportsSelectedRetailer";

const Page = () => {
  const [users, setUsers] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [projectList, setProjectList] = useState([])
  const [projectListLoading, setProjectListLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('')
  const [retailerList, setRetailerList] = useState([]);
  const [retailerListLoading, setRetailerListLoading] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [error, setError] = useState(null);
  const [projectType, setProjectType] = useState('activeProjects')
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentUser, setCurrentUser] = useState()

  const fetchRetailerList = React.useCallback(async () => {
    try {
      setRetailerListLoading(true);
      // Try new apiGet /retailers first (new base), fallback to legacy /getretailers
      let data;
      try {
        const { apiGet } = await import("@/lib/api");
        data = await apiGet("/retailers").catch(() => null);
        if (data) {
          const list = data?.retailers ?? data?.retailerid ?? data?.data ?? data;
          if (Array.isArray(list) && list.length) {
            setRetailerList(list);
            return;
          }
          if (Array.isArray(data) && data.length) {
            setRetailerList(data);
            return;
          }
        }
      } catch {}
      // Fallback to legacy lambda
      data = await lambdaGet(`/getretailers`);
      const list = data?.retailerid ?? data?.retailers ?? data?.data ?? data;
      setRetailerList(Array.isArray(list) ? list : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching retailer list:", err);
      setRetailerList([]);
    } finally {
      setRetailerListLoading(false);
    }
  }, []);

  const fetchProjectList = React.useCallback(async (rid, type = projectType) => {
    if (!rid) return
    setProjectListLoading(true)

    const url =
      type === "activeProjects"
        ? `/listprojects/${rid}`
        : `/listprojects/${rid}/archive`;

    try {
      const data = await lambdaGet(url);
      const list = Array.isArray(data) ? data : (data?.projects ?? data?.data ?? []);
      setProjectList(list);
    } catch (error) {
      console.error("Error fetching project list:", error);
      setProjectList([]);
    } finally {
      setProjectListLoading(false);
    }
  }, [projectType]);

  const fetchUsers = React.useCallback(async () => {
    try {
      setUserListLoading(true)
      const data = await lambdaGet(`/userlist`);
      setUsers(data);
      setUserListLoading(false)
    } catch (err) {
      setError(err.message);
    } finally {
      setUserListLoading(false);
    }
  }, []);

  // Hydrate selectedRetailer from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) || "";
    if (stored) setSelectedRetailer(stored);
  }, []);

  const filteredProjects = React.useMemo(() => {
    let filtered = projectList;

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = projectList.filter(item => {
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
  }, [projectList, searchTerm, sortConfig]);

  const totalRows = filteredProjects?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredProjects?.slice(startIndex, endIndex) || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, projectList, sortConfig]);

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchRetailerList();
  }, []);

  useEffect(() => {
    if (!retailerListLoading && retailerList?.length) {
      const storedRetailerId = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : "";
      const hasStored = storedRetailerId && retailerList.some((ret) => (ret.retailerid ?? ret.id ?? ret.retailerId) === storedRetailerId);
      if (hasStored) {
        if (selectedRetailer !== storedRetailerId) {
          setSelectedRetailer(storedRetailerId);
        }
        fetchProjectList(storedRetailerId, projectType);
      }
    }
  }, [retailerList, retailerListLoading, projectType, fetchProjectList, selectedRetailer]);

  const handleReload = () => {
    fetchProjectList(selectedRetailer)
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  }

  const handleRetailerChange = (retailerId) => {
    setSelectedRetailer(retailerId);

    if (typeof window !== "undefined") {
      if (retailerId) {
        window.localStorage.setItem(STORAGE_KEY, retailerId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    fetchProjectList(retailerId);
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setSelectedRetailer('');
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setProjectList([]);
    setSortConfig({ key: null, direction: 'asc' });
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

  return (
    <AppLayout>
      <div className="relative h-full flex flex-col text-gray-600">
        <div className="flex flex-col w-full sticky top-0 z-10 pt-1 mb-2">
          <div className="flex justify-between">
            <div className="flex gap-4 items-center">
              <CreateProjectModal onCreated={() => fetchProjectList(selectedRetailer, projectType)} />
              <div className="flex items-center gap-2">
                <label htmlFor="retailer-options" className="block">
                  Select retailer:
                </label>

                <div className="relative">
                  <select
                    id="retailer-options"
                    className="block cursor-pointer w-64 appearance-none bg-white px-4 py-2 pr-10 text-sm text-gray-700 shadow-sm focus:border-blue-200 focus:ring-2 focus:ring-gray-200 focus:outline-none rounded disabled:opacity-50"
                    onChange={(e) => {
                      const rid = e.target.value;
                      handleRetailerChange(rid);
                    }}
                    disabled={retailerListLoading || !retailerList?.length}
                    value={selectedRetailer || ""}
                  >
                    {retailerListLoading ? (
                      <option value="" disabled>
                        Loading...
                      </option>
                    ) : (
                      <>
                        <option value="" disabled>
                          -- Select a retailer --
                        </option>
                        {retailerList?.map((ret) => {
                          const rid = ret.retailerid ?? ret.id ?? ret.retailerId ?? "";
                          const rname = ret.name ?? ret.retailer_name ?? rid;
                          return (
                            <option key={rid} value={rid}>
                              {rname}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                  {retailerListLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none">
                      <svg className="w-4 h-4 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleClearFilter}
                type="button"
                className="flex items-center gap-1 px-4 py-1 cursor-pointer bg-blue-400 hover:bg-blue-500 text-white border border-gray-300 transition"
              >
                Clear filter
              </button>
            </div>
            <div>
              <button
                onClick={handleReload}
                disabled={projectListLoading || notificationsLoading || userListLoading}
                className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:hover:bg-blue-500"
              >
                <ReloadIcon className={`w-4 h-4 text-white ${projectListLoading || notificationsLoading || userListLoading ? 'animate-spin' : ''}`} />
                {projectListLoading || notificationsLoading || userListLoading ? "Reloading..." : "Reload"}
              </button>
            </div>
          </div>
          <div className="w-full relative flex justify-between pt-4">
            <div className="flex border-b border-gray-200">
              {["activeProjects", "archiveProjects"].map((type) => (
                <button
                  key={type}
                  disabled={projectListLoading || notificationsLoading}
                  onClick={() => {
                    if (projectType !== type) {
                      setProjectType(type);
                      fetchProjectList(selectedRetailer, type);
                    }
                  }}
                  className={`cursor-pointer relative px-3 py-2 text-sm font-medium transition-all duration-200 
                ${projectType === type
                      ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                      : "text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-200"
                    } disabled:opacity-40`}
                >
                  {type === "activeProjects" ? "Active Projects" : "Archived Projects"}
                </button>
              ))}
            </div>
            <div className="flex">
              <div className="flex">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 bg-white border-white rounded-l px-4 py-1.5 pr-10 shadow-sm focus:border-blue-300 focus:ring-0 focus:outline-none"
                    placeholder="Search projects..."
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                      <CloseCircleIcon className="w-4 h-4 text-gray-500 cursor-pointer " />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="cursor-pointer flex items-center gap-1 px-4 bg-blue-600 text-white rounded-r hover:bg-blue-700 transition"
                >
                  <SearchIcon className="w-5 h-5 text-white cursor-pointer " />
                </button>
              </div>
            </div>
          </div>
        </div>

        <ProjectsTable
          projectListData={paginatedData}
          projectListLoading={projectListLoading}
          userListLoading={userListLoading}
          selectedRetailer={selectedRetailer}
          projectType={projectType}
          sortConfig={sortConfig}
          onSort={handleSort}
          notificationsLoading={notificationsLoading}
          retailerListLoading={retailerListLoading}
          fetchProjectList={fetchProjectList}
        />

        {projectList?.length > 0 && selectedRetailer && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
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
                  Showing {totalRows > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalRows)} of {totalRows}
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
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  title="First page"
                >
                  <DoubleArrowLeftIcon className="w-6 h-6 text-gray-700" />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Previous page"
                >
                  <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Next page"
                >
                  <ArrowRightIcon className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Last page"
                >
                  <DoubleArrowRightIcon className="w-6 h-6 text-gray-600" />
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
