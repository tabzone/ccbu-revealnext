'use client'
import PublishModal from "./components/PublishModal";
import PublishProjectReqTable from "./components/PublishProjectReqTable";
import { lambdaGet, lambdaPost } from "@/app/lamda/lambdaClient";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCcw, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import AppLayout from "@/app/components/layout/AppLayout";
import useAppTheme from "@/app/hooks/useAppTheme";

const dummyData = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  project: `Project ${i + 1}`,
  status: i % 2 === 0 ? "Open" : "Closed",
  owner: `Owner ${i % 10}`,
}));

function Page() {
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [compareProjectList, setCompareProjectList] = useState([])
  const [selectedCompareProject, setSelectedCompareProject] = useState(null)
  const [compareProjectLoading, setCompareProjectLoading] = useState(false)
  const [currentProjectDetails, setCurrentProjectDetails] = useState(null)
  const [compareProjectError, setCompareProjectError] = useState('')
  const [projectReqData, setProjectReqData] = useState([])
  const [loadingReqData, setLoadingReqData] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [step, setStep] = useState(0)
  const [createReqData, setCreateReqData] = useState()
  const [createReqLoading, setCreateReqLoading] = useState()
  const [updateReqData, setUpdateReqData] = useState()
  const [updtReqLoading, setUpdtReqLoading] = useState(false)
  const [validationData, setValidationData] = useState(null)
  const [validationLoading, setValidationLoading] = useState(false)
  const [error, setError] = useState(null)


  const [isActiveReport, setIsActiveReport] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50)

  const { retailerId, projectId } = useParams();

  // CCBU adaptation: no Redux store — use local project fetch instead
  const singleProject = null;
  const currentProjectId = projectId;
  const setSingleProjectLoading = false;

  const getRetailerIdFromProject = (project) => {
    if (!project) return "";
    // Unwrap if API returns {project: {...}} wrapper (common for /getproject)
    const raw = project?.project || project;
    const candidate =
      raw?.retailID ??
      raw?.retailerid ??
      raw?.retailerId ??
      raw?.retailId ??
      raw?.retailer_id ??
      raw?.baseCallPoints ??
      raw?.basecallpoints ??
      raw?.baseCallpoints ??
      raw?.retailer ??
      raw?.retailerID ??
      raw?.ri ??
      raw?.rl ??
      "";
    // Normalize: array → first element, object → id field, string → trimmed
    if (Array.isArray(candidate)) {
      const first = candidate[0];
      if (first == null) return "";
      if (typeof first === "string") return String(first).trim();
      if (typeof first === "object") return String(first?.id ?? first?.retailerid ?? first?.retailerId ?? first?.retailID ?? "").trim();
      return String(first).trim();
    }
    if (typeof candidate === "object" && candidate !== null) {
      return String(candidate?.id ?? candidate?.retailerid ?? candidate?.retailerId ?? candidate?.retailID ?? "").trim();
    }
    return String(candidate ?? "").trim();
  };

  const getProjectLabel = (project) => {
    return project?.projName || project?.projectName || project?.name || `Project ${project?.projectid || project?.id || ""}`;
  };

  const getProjectValue = (project, key, fallback = "-") => {
    const mappedKey = key === "prodCount"
      ? "prodCount"
      : key === "pogCount"
        ? "pogCount"
        : key === "storeExtraction"
          ? "storeExtraction"
          : key;

    return project?.[mappedKey] ?? project?.[mappedKey.toLowerCase()] ?? project?.[mappedKey.toUpperCase()] ?? fallback;
  };

  const filteredProjectReq = useMemo(() => {
    let filtered = projectReqData;

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
  }, [projectReqData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key !== key) {
        return { key, direction: 'asc' };
      } else if (prevConfig.direction === 'asc') {
        return { key, direction: 'desc' };
      } else {
        return { key: null, direction: 'asc' };
      }
    });
  }

  const totalRows = filteredProjectReq?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredProjectReq?.slice(startIndex, endIndex) || [];
  const isPublishDisabled = isLoading || (isEnabled && !selectedCompareProject);

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };


  useEffect(() => {
    if (!projectId) return;

    fetchProjectRequestData('SUB');
    fetchCurrentProjectDetails();
    if (isEnabled && !compareProjectList.length && !compareProjectLoading) {
      fetchCompareProjects();
    }
  }, [projectId]);

  const fetchCurrentProjectDetails = async () => {
    if (!projectId) return null;

    try {
      const data = await lambdaGet(`/getproject/${projectId}`);
      if (!data || data.error) {
        console.log(data.error);
        return null;
      }
      setCurrentProjectDetails(data);
      return data;
    } catch (err) {
      console.error("Error fetching current project details:", err);
      return null;
    }
  };

  const fetchProjectRequestData = async (filetype) => {
    if (!projectId) return;
    try {
      setLoadingReqData(true);
      const data = await lambdaGet(`/getprojectrequest/${projectId}/${filetype}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setProjectReqData(data?.data);
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoadingReqData(false);
    }
  }

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



  const fetchCompareProjects = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setCompareProjectLoading(true);
      setCompareProjectError('');
      setCompareProjectList([]);

      const projectPayload = currentProjectDetails || singleProject;
      let retailerId = getRetailerIdFromProject(projectPayload);

      if (!retailerId) {
        const fetchedProject = await fetchCurrentProjectDetails();
        retailerId = getRetailerIdFromProject(fetchedProject);
      }

      if (!retailerId) {
        throw new Error("Missing retailer id for comparison project lookup");
      }

      // Retailer-aware: try new apiGet first, fallback to legacy lambdaGet (both require retailerId)
      let data;
      try {
        const { apiGet } = await import("@/lib/api");
        const res = await apiGet(`/retailers/listprojects/${retailerId}`).catch(() => null);
        if (res) {
          data = res;
        }
      } catch {}
      if (!data) {
        data = await lambdaGet(`/listprojects/${retailerId}`);
      }
      const list = Array.isArray(data)
        ? data
        : (data?.projects ?? data?.data ?? []);

      const filteredList = (Array.isArray(list) ? list : []).filter((project) => {
        const projectId = project?.projectid || project?.id;
        return String(projectId) !== String(currentProjectId);
      });

      setCompareProjectList(filteredList);

      if (!filteredList.length) {
        setCompareProjectError("No comparison projects available.");
      }
    } catch (error) {
      console.error("Toggle API error:", error);
      setCompareProjectError("Failed to load comparison projects.");
      setCompareProjectList([]);
    } finally {
      setIsLoading(false);
      setCompareProjectLoading(false);
    }
  };

  const handleToggle = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    setCompareProjectError('');
    setSelectedCompareProject(null);

    if (!newState) {
      setCompareProjectList([]);
      setIsActiveReport(false);
      return;
    }

    await fetchCompareProjects();
  };

  const handleCompareProjectSelect = (event) => {
    const selectedId = event.target.value;
    const selected = compareProjectList.find((project) => String(project?.projectid || project?.id) === String(selectedId));
    setSelectedCompareProject(selected || null);
  };

  const handlePublishOpen = () => {
    setOpenModal(true)
    createProjRequest()
  }

  const closeModal = () => {
    setOpenModal(false)
    setCreateReqData(null)
    setIsEnabled(false)
    setSelectedCompareProject(null)
    setCompareProjectList([])
    setCompareProjectError('')
  }


  const createProjRequest = async () => {
    try {

      const payload = { filetype: "SUB", projectid: projectId }
      const data = await lambdaPost("/createrequest", payload);
      setCreateReqData(data)
      return data
    } catch (err) {
      console.log(err, 'error');
      setCreateReqData([])
    }
    finally {

    }
  }

  const updateRequest = async (
    basecallpoints,
    comparedProject,
    compareid,
    filecount,
    filename,
    filetype,
    isCompare,
    projectid,
    requestflow,
    requestid,
    requeststatus,
    selectedExcludedStores = []
  ) => {
    try {
      setUpdtReqLoading(true)
      const comparisonProjectId = selectedCompareProject
        ? selectedCompareProject?.projectid || selectedCompareProject?.id
        : null;
      const normalizedExcludedStores = Array.isArray(selectedExcludedStores)
        ? selectedExcludedStores.map((s) => String(s).trim()).filter(Boolean)
        : [];
      const payload = {
        basecallpoints,
        comparedProject,
        compareid,
        filecount,
        filename,
        filetype,
        isCompare,
        projectid,
        requestflow,
        requestid,
        requeststatus,
        compared_project: comparisonProjectId,
        is_compare: Boolean(isEnabled && comparisonProjectId),
        is_active_report: isEnabled && isActiveReport,
        excludedstores: normalizedExcludedStores,
      };

      const data = await lambdaPost("/updaterequest", payload);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setUpdateReqData(data)
      return data
    } catch (err) {
      console.error('Error in updateRequest:', err);
      setError(err.message);
      setUpdateReqData([])
    } finally {
      setUpdtReqLoading(false);
    }
  };


  return (
    <AppLayout>
    <div className="flex flex-col gap-4 w-full min-h-0 p-2 pb-8 rounded-2xl" style={{ backgroundColor: th.bgSub }}>

      <div className="flex flex-col md:flex-row gap-6 shrink-0 relative">
        <div className="w-full rounded-2xl border shadow-sm" style={{ backgroundColor: th.bg, borderColor: th.border }}>
          {/* Header */}
          <div className="border-b px-6 py-5" style={{ borderColor: th.border }}>
            <h3 className="text-xl font-semibold" style={{ color: th.textPri }}>
              Publish For Extraction
            </h3>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-5">
              {/* Comparison Settings */}
              <div className="rounded-xl border p-4" style={{ backgroundColor: th.bgSub, borderColor: th.border }}>
                <div
                  className={`grid gap-4 ${isEnabled
                    ? "md:grid-cols-2 md:items-start"
                    : "grid-cols-1"
                    }`}
                >
                  {/* Toggle */}
                  <div>
                    <label className="mb-2 block text-sm font-medium" style={{ color: th.textPri }}>
                      Comparison Report
                    </label>

                    <div className="flex min-h-[42px] items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={handleToggle}
                        disabled={isLoading || setSingleProjectLoading}
                        className={`
                        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
                        transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${isEnabled
                            ? "bg-green-500"
                            : "bg-gray-300"
                          }
                         ${isLoading || setSingleProjectLoading
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                          }
                        `}
                      >
                        <span
                          className={`
                            inline-block h-5 w-5 rounded-full bg-white shadow-sm
                            transition-transform duration-200
                            ${isEnabled
                              ? "translate-x-[22px]"
                              : "translate-x-0.5"
                            }
                          `}
                        />
                      </button>

                      <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ color: th.textPri }}>
                          Create Comparison Report
                        </span>

                        <span
                          className="text-xs"
                          style={{ color: isEnabled ? "#16a34a" : th.textSec }}
                        >
                          {isLoading
                            ? "Loading..."
                            : isEnabled
                              ? "Enabled"
                              : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project Selector */}
                  {isEnabled && (
                    <div className="min-w-0">
                      <label
                        htmlFor="comparison-project"
                        className="mb-2 block text-sm font-medium"
                        style={{ color: th.textPri }}
                      >
                        Comparison Project
                      </label>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          {compareProjectLoading ? (
                            <div className="flex h-[42px] w-full items-center gap-2 rounded-lg border px-3" style={{ backgroundColor: th.bgSub, borderColor: th.border }}>
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
                              <span className="text-sm" style={{ color: th.textSec }}>Loading projects...</span>
                            </div>
                          ) : (
                            <select
                              id="comparison-project"
                              value={
                                selectedCompareProject?.projectid ||
                                selectedCompareProject?.id ||
                                ""
                              }
                              onChange={handleCompareProjectSelect}
                              disabled={!compareProjectList.length}
                              className="truncate h-[42px] w-full rounded-lg border px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed truncate"
                              style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textPri }}
                            >
                              <option value="">
                                {compareProjectList.length
                                  ? "-- Select a project --"
                                  : "No comparison projects available"}
                              </option>

                              {compareProjectList.map((project) => (
                                <option
                                  key={project?.projectid || project?.id}
                                  value={project?.projectid || project?.id}
                                  title={getProjectLabel(project)}
                                  style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                >
                                  {getProjectLabel(project)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {selectedCompareProject && (
                          <button
                            type="button"
                            onClick={() => setSelectedCompareProject(null)}
                            title="Clear selection"
                            aria-label="Clear comparison project"
                            className="shrink-0 inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border transition"
                            style={{ backgroundColor: th.bg, borderColor: th.border, color: th.textSec }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = th.bg)}
                          >
                            ×
                          </button>
                        )}
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsActiveReport(!isActiveReport)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200"
                            style={isActiveReport ? { backgroundColor: th.accent, color: "#fff" } : { backgroundColor: th.bg, color: th.textPri, borderWidth: "1px", borderStyle: "solid", borderColor: th.border }}
                            onMouseEnter={(e) => { if (!isActiveReport) e.currentTarget.style.backgroundColor = th.hover; }}
                            onMouseLeave={(e) => { if (!isActiveReport) e.currentTarget.style.backgroundColor = th.bg; }}
                          >
                            <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${isActiveReport ? "" : ""}`} style={{ backgroundColor: isActiveReport ? "#64748b" : "#d1d5db" }}>
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${isActiveReport ? "translate-x-3.5" : "translate-x-0.5"}`} />
                            </span>
                            Active Report
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {isEnabled && compareProjectError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-600">
                      {compareProjectError}
                    </p>
                  </div>
                )}

                {/* Selected Project Details */}
                {isEnabled && selectedCompareProject && (
                  <div className="mt-5 overflow-hidden rounded-xl border" style={{ backgroundColor: th.bg, borderColor: th.border }}>
                    <div className="border-b px-4 py-3" style={{ backgroundColor: th.bgSub, borderColor: th.border }}>
                      <h4 className="text-sm font-semibold" style={{ color: th.textPri }}>
                        Comparison Report Details
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4" style={{ borderColor: th.border }}>
                      <div className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: th.textSec }}>
                          Project Name
                        </p>
                        <p className="mt-1 text-sm font-medium truncate" style={{ color: th.textPri }} title={getProjectLabel(selectedCompareProject)}>
                          {getProjectLabel(selectedCompareProject)}
                        </p>
                      </div>

                      <div className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: th.textSec }}>
                          Product Count
                        </p>
                        <p className="mt-1 text-sm font-medium" style={{ color: th.textPri }}>
                          {getProjectValue(
                            selectedCompareProject,
                            "prodCount",
                            "-"
                          )}
                        </p>
                      </div>

                      <div className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: th.textSec }}>
                          Store Extraction
                        </p>
                        <p className="mt-1 text-sm font-medium" style={{ color: th.textPri }}>
                          {getProjectValue(
                            selectedCompareProject,
                            "storeExtraction",
                            "-"
                          )}
                        </p>
                      </div>

                      <div className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: th.textSec }}>
                          POG Count
                        </p>
                        <p className="mt-1 text-sm font-medium" style={{ color: th.textPri }}>
                          {getProjectValue(
                            selectedCompareProject,
                            "pogCount",
                            "-"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-start border-t pt-5" style={{ borderColor: th.border }}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(true)
                    createProjRequest()
                    fetchValidationData()
                  }}
                  disabled={isPublishDisabled}
                  className={`
              inline-flex min-w-[100px] items-center justify-center
              rounded-lg px-5 py-2.5
              text-sm font-medium text-white
              shadow-sm transition
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isPublishDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:opacity-90 active:opacity-80"
                    }
            `}
                  style={{ backgroundColor: th.accent, color: "#fff" }}
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>


      </div>

      <div className="flex justify-between items-center shrink-0 mb-2">
        <h2 className="text-lg font-semibold" style={{ color: th.textPri }}>Project Requests</h2>
        <button
          onClick={() => fetchProjectRequestData('SUB')} className="cursor-pointer flex items-center gap-2 px-4 py-1.5 rounded-full shadow-sm transition disabled:opacity-50 hover:opacity-90" style={{ backgroundColor: th.accent, color: "#fff" }}>
          <RefreshCcw className={`w-4 h-4 ${loadingReqData && 'animate-spin'}`} />
          Reload
        </button>
      </div>
      <div className="w-full overflow-x-auto overflow-y-visible shrink-0 min-h-[320px]">
        <PublishProjectReqTable
          theme={th}
          data={paginatedData}
          isLoading={loadingReqData}
          sortConfig={null}
          onSort={handleSort}
        />
      </div>
      {openModal &&
        <PublishModal
          open={openModal}
          setOpen={closeModal}
          updateRequest={updateRequest}
          createProjRequest={createProjRequest}
          createReqData={createReqData}
          setCreateReqData={setCreateReqData}
          validationData={validationData}
          setValidationData={setValidationData}
          createReqLoading={createReqLoading}
          validationLoading={validationLoading}
          fetchProjectRequestData={fetchProjectRequestData}
        />
      }

    </div>
    </AppLayout>
  );
}

export default Page;
