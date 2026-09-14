'use client'
import UploadModal from "./components/UploadModal";
import ProjectReqTable from "./components/ProjectReqTable";
import { lambdaGet, lambdaPost } from "@/app/lamda/lambdaClient";
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCcw } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import AppLayout from "@/app/components/layout/AppLayout";

const Page = () => {
  const [uploadDropdown, setUploadDropdown] = useState(false)
  const [uploadFileModal, setUploadFileModal] = useState(false)
  const [uploadFolderModal, setUploadFolderModal] = useState(false)
  const [pdfUploadDropdown, setPdfUploadDropdown] = useState(false)
  const [uploadPdfFileModal, setUploadPdfFileModal] = useState(false)
  const [uploadPdfFolderModal, setUploadPdfFolderModal] = useState(false)
  const [projectData, setProjectData] = useState([])
  const [projectLoading, setProjectLoading] = useState(false)
  const [error, setError] = useState()
  const [projectReqListData, setProjectReqListData] = useState([])
  const [projectReqLoading, setProjectReqLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'reqdate', direction: 'desc' });

  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [createReqData, setCreateReqData] = useState()
  const [updateReqData, setUpdateReqData] = useState()
  const [updtReqLoading, setUpdtReqLoading] = useState(false)
  const params = useParams()




  const filteredProjectReq = useMemo(() => {
    let filtered = projectReqListData;

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
  }, [projectReqListData, sortConfig]);

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

  const totalRows = filteredProjectReq?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredProjectReq?.slice(startIndex, endIndex) || [];

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };


  useEffect(() => {
    if (!params?.id) return;
    fetchProject();
    fetchProjectReqList()
  }, [params?.id]);


  async function fetchProject() {
    try {
      setProjectLoading(true)
      const data = await lambdaGet(`/getproject/${params?.id}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setProjectData(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setProjectLoading(false);
    }
  }

  const fetchProjectReqList = async () => {
    if (!params?.id) return
    setProjectReqLoading(true)
    try {
      const data = await lambdaGet(`/getallprojectrequest/${params?.id}`);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setProjectReqListData(data?.data || []);
    } catch (error) {
      console.error("Error fetching project list:", error);
      setProjectReqListData([]);
    } finally {
      setProjectReqLoading(false);
    }
  };


  const handleReload = () => {
    fetchProjectReqList();
    setSortConfig({ key: 'reqdate', direction: 'desc' });
  }

  const createProjRequest = async (fileType = 'PSA') => {
    try {
      const payload = { filetype: fileType, projectid: params?.id }
      const data = await lambdaPost("/createrequest", payload);
      setCreateReqData(data)
      return data
    } catch (err) {
      console.log(err, 'error');
      setCreateReqData([])
    }
  }



  const updateRequest = async (
    projId = '',
    reqId = '',
    requestStatus = 'processing',
    filecount = 0,
    uploadType = 'PSA',
    filename = '',
    requestflow = '',
    basecallpoints = []
  ) => {
    try {
      setUpdtReqLoading(true);
      const payload = {
        projectid: projId || params?.id,
        requestid: reqId || createReqData?.requestid,
        requeststatus: requestStatus,
        filecount,
        filetype: uploadType,
        filename,
        requestflow,
        basecallpoints,
        compareid: '',
        isCompare: '',
        comparedProject: ''
      };

      const data = await lambdaPost("/updaterequest", payload);
      if (!data || data.error) {
        console.log(data.error);
        return;
      }
      setUpdateReqData(data)

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
    <div className="relative w-full h-full flex flex-col text-gray-600">
      <div className="flex flex-col md:flex-row gap-6 mb-2 relative">
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl 
      shadow-sm p-6 flex flex-col items-center justify-center relative">
          {projectReqListData.filter(
            (items) => items.filetype === 'PSA' && items.status === 'complete'
          ).length !== 0 ? (
            <Check title={'Upload Complete'} className="cursor-pointer rounded-full w-8 h-8 absolute right-2 top-2 p-1 border bg-green-500 border-green-500 text-white" />

          ) : null}
          <h3 className="text-xl font-semibold mb-1">PSA Files</h3>
          <span className="text-base">Click to upload Planogram files</span>

          <div
            className="relative"
            onMouseEnter={() => setUploadDropdown(true)}
            onMouseLeave={() => setUploadDropdown(false)}
          >
            <button className="px-4 py-1 bg-blue-500 text-white my-4 cursor-pointer rounded">
              Upload
            </button>

            {uploadDropdown && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-14  bg-white w-44 shadow-lg rounded-md border border-gray-200 z-10 text-center"
              >
                <button
                  onClick={() => {
                    setUploadFileModal(true);
                    setUploadDropdown(false);
                    createProjRequest()
                  }}
                  className=" w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer  flex items-center gap-1"
                >
                  Upload File
                </button>

                <button
                  onClick={() => {
                    setUploadDropdown(false);
                    setUploadFolderModal(true)
                    createProjRequest()
                  }}
                  className=" w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-1"
                >
                  Upload Folder
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center relative">
          {projectReqListData.filter(
            (items) => items.filetype === 'PDF' && items.status === 'complete'
          ).length !== 0 ? (
            <Check title="Upload Complete" className="cursor-pointer rounded-full w-8 h-8 absolute right-2 top-2 p-1 border bg-green-500 border-green-500 text-white" />
          ) : null}
          <h3 className="text-xl font-semibold mb-1">PDF Files</h3>
          <span className="text-base">Click to upload PDF files</span>
          <div
            className="relative"
            onMouseEnter={() => setPdfUploadDropdown(true)}
            onMouseLeave={() => setPdfUploadDropdown(false)}
          >
            <button className="px-4 py-1 bg-blue-500 text-white my-4 cursor-pointer rounded">
              Upload
            </button>

            {pdfUploadDropdown && (
              <div className="absolute left-1/2 -translate-x-1/2 top-14 bg-white w-44 shadow-lg rounded-md border border-gray-200 z-10 text-center">
                <button
                  onClick={() => {
                    setUploadPdfFileModal(true);
                    setPdfUploadDropdown(false);
                    createProjRequest('PDF');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-1"
                >
                  Upload File
                </button>
                <button
                  onClick={() => {
                    setUploadPdfFolderModal(true);
                    setPdfUploadDropdown(false);
                    createProjRequest('PDF');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-1"
                >
                  Upload Folder
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-700">Project Requests</h2>
        <button
          onClick={handleReload}
          disabled={projectReqLoading}
          className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 transition disabled:opacity-50 disabled:hover:bg-blue-500"
        >
          <RefreshCcw
            className={`w-4 h-4 ${projectReqLoading ? 'animate-spin' : ''}`}
          />
          {projectReqLoading ? "Reloading..." : "Reload"}
        </button>
      </div>
      <ProjectReqTable
        data={paginatedData}
        isLoading={projectReqLoading}
        sortConfig={sortConfig}
        onSort={handleSort}

      />

      {projectReqListData?.length > 0 && (
        <div className=" bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
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
                <ChevronsLeft className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      <>

        {uploadFileModal &&
          <UploadModal
            open={uploadFileModal}
            setOpen={setUploadFileModal}
            updateRequest={updateRequest}
            createProjRequest={createProjRequest}
            fetchProjectReqList={fetchProjectReqList}
            typeToUpload='files'
            createReqData={createReqData}

          />

        }

        {
          uploadFolderModal &&
          <UploadModal
            open={uploadFolderModal}
            setOpen={setUploadFolderModal}
            updateRequest={updateRequest}
            createProjRequest={createProjRequest}
            fetchProjectReqList={fetchProjectReqList}
            typeToUpload='folders'
            createReqData={createReqData}
          />
        }

        {uploadPdfFileModal &&
          <UploadModal
            open={uploadPdfFileModal}
            setOpen={setUploadPdfFileModal}
            updateRequest={updateRequest}
            createProjRequest={createProjRequest}
            fetchProjectReqList={fetchProjectReqList}
            typeToUpload="files"
            createReqData={createReqData}
            fileType="PDF"
          />
        }

        {uploadPdfFolderModal &&
          <UploadModal
            open={uploadPdfFolderModal}
            setOpen={setUploadPdfFolderModal}
            updateRequest={updateRequest}
            createProjRequest={createProjRequest}
            fetchProjectReqList={fetchProjectReqList}
            typeToUpload="folders"
            createReqData={createReqData}
            fileType="PDF"
          />
        }
      </>
    </div>
    </AppLayout>
  )

};

export default Page;
