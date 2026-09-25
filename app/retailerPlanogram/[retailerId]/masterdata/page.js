'use client'
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CreateProjectModal from "@/app/components/modal/CreateProjectModal";
import ProjectsTable from "@/app/components/table/ProjectsTable";
import { ReloadIcon, SearchIcon, CloseCircleIcon, ArrowLeftIcon, ArrowRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@/data/icons";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import AppLayout from "@/app/components/layout/AppLayout";
import useAppTheme from "@/app/hooks/useAppTheme";

const Page = () => {
  const params = useParams();
  const retailerId = params?.retailerId ?? params?.id ?? "";

  const [projectList, setProjectList] = useState([])
  const [projectListLoading, setProjectListLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectType, setProjectType] = useState('activeProjects')
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    const th = useAppTheme();

  const fetchProjectList = React.useCallback(async (type = projectType) => {
    if (!retailerId) return
    setProjectListLoading(true)
    const url =
      type === "activeProjects"
        ? `/listprojects/${retailerId}`
        : `/listprojects/${retailerId}/archive`;
    try {
      const data = await lambdaGet(url);
      const list = Array.isArray(data) ? data : (data?.projects ?? data?.data ?? []);
      setProjectList(list);
    } catch (err) {
      console.error("Error fetching project list:", err);
      setProjectList([]);
    } finally {
      setProjectListLoading(false);
    }
  }, [retailerId, projectType]);

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
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
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

  useEffect(() => { setCurrentPage(1); }, [searchTerm, projectList, sortConfig]);

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (retailerId) fetchProjectList(projectType);
  }, [retailerId, projectType, fetchProjectList]);

  const handleReload = () => {
    fetchProjectList(projectType)
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  }

  const handleClearFilter = () => {
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
  }

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key !== key) return { key, direction: 'asc' };
      else if (prevConfig.direction === 'asc') return { key, direction: 'desc' };
      else return { key: null, direction: '' };
    });
  }

  return (
    <AppLayout>
      <div className="relative h-full flex flex-col text-gray-600">
        <div className="flex flex-col w-full sticky top-0 z-10 pt-1 mb-2">
          <div className="flex justify-between">
            <div className="flex gap-4 items-center">
              <CreateProjectModal retailerId={retailerId} onCreated={() => fetchProjectList(projectType)} />
              {/* <button
                onClick={handleClearFilter}
                type="button"
                className="flex items-center gap-1 px-4 py-1 cursor-pointer bg-blue-400 hover:bg-blue-500 text-white border border-gray-300 transition"
              >
                Clear filter
              </button> */}
            </div>
            <div>
              <button
                onClick={handleReload}
                disabled={projectListLoading}
                className="cursor-pointer flex items-center gap-2 px-4 py-1.5 text-white rounded-full shadow-sm transition disabled:opacity-50"
                style={{ backgroundColor: th.accent }}
              // className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:hover:bg-blue-500"
              >
                <ReloadIcon className={`w-4 h-4 text-white ${projectListLoading ? 'animate-spin' : ''}`} />
                {projectListLoading ? "Reloading..." : "Reload"}
              </button>
            </div>
          </div>
          <div className="w-full relative flex justify-between pt-4">
            <div className="flex border-b border-gray-200">
              {["activeProjects", "archiveProjects"].map((type) => (
                <button
                  key={type}
                  disabled={projectListLoading}
                  onClick={() => {
                    if (projectType !== type) {
                      setProjectType(type);
                      fetchProjectList(type);
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
            <div className="relative flex-1 max-w-[320px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border pl-9 pr-8 py-2.5 text-sm outline-none transition bg-white"
                placeholder="Search projects..."
                style={{ borderColor: "#e5e7eb" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition cursor-pointer text-gray-500"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <ProjectsTable
          projectListData={paginatedData}
          projectListLoading={projectListLoading}
          userListLoading={false}
          selectedRetailer={retailerId}
          projectType={projectType}
          sortConfig={sortConfig}
          onSort={handleSort}
          notificationsLoading={false}
          retailerListLoading={false}
          fetchProjectList={() => fetchProjectList(projectType)}
        />

        {projectList?.length > 0 && retailerId && (
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
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="First page">
                  <DoubleArrowLeftIcon className="w-6 h-6 text-gray-700" />
                </button>
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="Previous page">
                  <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="Next page">
                  <ArrowRightIcon className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition" title="Last page">
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
