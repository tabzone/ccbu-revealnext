'use client'
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CreateProjectModal from "@/app/components/modal/CreateProjectModal";
import ProjectsTable from "@/app/components/table/ProjectsTable";
import { ReloadIcon, SearchIcon, CloseCircleIcon, ArrowLeftIcon, ArrowRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@/data/icons";
import { lambdaGet } from "@/app/lamda/lambdaClient";
import AppLayout from "@/app/components/layout/AppLayout";

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
                disabled={projectListLoading}
                className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:hover:bg-blue-500"
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
