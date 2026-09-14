'use client';
import AppLayout from "@/app/components/layout/AppLayout";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DownloadIcon, PieChart, UploadIcon } from "lucide-react";

import ProjectProductTble from "./components/ProjectProductTble";
import UploadProductsModal from "./components/UploadProductsModal";
import { lambdaGet, lambdaPost } from "@/app/lamda/lambdaClient";
import { toast } from "react-toastify";
import { CloseCircleIcon, SearchIcon } from "./components/icons";
import { useProject } from "@/app/hooks/useProject";

const SwipeCards = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalsError, setTotalsError] = useState(null);
  const [filterSub, setFilterSub] = useState([]);
  const [filterSubLoading, setFilterSubLoading] = useState(false);
  const [hierarchyError, setHierarchyError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("reportproducthierarchy");
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [uploadModal, setUploadModal] = useState(false)
  const [updateReqData, setUpdateReqData] = useState()
  const [updtReqLoading, setUpdtReqLoading] = useState(false)
  const [projectProductData, setProjectProductData] = useState(null)
  const [projectProducLoading, setProjectProducLoading] = useState(null)
  const [productsError, setProductsError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHierarchy, setActiveHierarchy] = useState('footage')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const [createReqData, setCreateReqData] = useState()

  const [selectedSubFilter, setSelectedSubFilter] = useState('');


  const scrollRef = useRef(null);
  const params = useParams();
  const { id } = params;
  const { retailerId } = useProject();

  const filteredProjectProduct = useMemo(() => {
    if (!projectProductData) return [];

    let filtered = [...projectProductData];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = projectProductData.filter(item => {
        return (
          item?.UPC?.toLowerCase().includes(lowerSearchTerm) ||
          item?.MasterUPC?.toLowerCase().includes(lowerSearchTerm) ||
          item?.ProductName?.toLowerCase().includes(lowerSearchTerm)
        );
      });
    }



    if (selectedSubFilter) {
      const filterKey = selectedFilter.replace('report', '').replace('hierarchy', '').toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.Category?.toLowerCase() === selectedSubFilter.toLowerCase() ||
          item.SubCategory?.toLowerCase() === selectedSubFilter.toLowerCase() ||
          item.Brand?.toLowerCase() === selectedSubFilter.toLowerCase() ||
          item.Package?.toLowerCase() === selectedSubFilter.toLowerCase() ||
          item.CategoryPlanogram?.toLowerCase() === selectedSubFilter.toLowerCase() ||
          item.BrandPlanogram?.toLowerCase() === selectedSubFilter.toLowerCase() ||
          item.PackagePlanogram?.toLowerCase() === selectedSubFilter.toLowerCase()
        );
      });
    }


    if (sortConfig.key) {
      filtered.sort((a, b) => {
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
  }, [projectProductData, searchTerm, sortConfig, selectedSubFilter, selectedFilter]);


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


  const totalRows = filteredProjectProduct?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredProjectProduct?.slice(startIndex, endIndex) || [];

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };


  // reset pagination when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, projectProductData, sortConfig]);

  const fetchTotals = async () => {
    try {
      setLoading(true);
      setTotalsError(null);

      const data = await lambdaGet(`/projecttotals/${id}`);
      if (!data || data.error) {
        throw new Error(data?.error || data?.message || 'Failed to load totals');
      }
      setData(data);
    } catch (err) {
      console.error("Error fetching totals:", err);
      setTotalsError(err.message || 'Failed to load totals');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectProducts = async () => {
    if (!retailerId) return;
    try {
      setProjectProducLoading(true);
      setProductsError(null);
      const data = await lambdaGet(`/projectproducts/${retailerId}/${id}`);
      if (!data || data.error) {
        throw new Error(data?.error || data?.message || 'Failed to load products');
      }
      setProjectProductData(data?.data);
    } catch (err) {
      console.error("Error fetching:", err);
      setProductsError(err.message || 'Failed to load products');
    } finally {
      setProjectProducLoading(false);
    }
  };


  const fetchProjectPlanogramHierarchy = async (filter) => {
    if (!id || !retailerId) return;
    try {
      setFilterSubLoading(true);
      setHierarchyError(null);
      const data = await lambdaGet(`/${filter}/${retailerId}/${id}`);
      if (!data || data.error) {
        throw new Error(data?.error || data?.message || 'Failed to load hierarchy');
      }
      setFilterSub(data?.data);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      setHierarchyError(err.message || 'Failed to load hierarchy');
    } finally {
      setFilterSubLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchTotals();
  }, [id]);

  useEffect(() => {
    if (id && retailerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProjectProducts();
    }
  }, [id, retailerId]);

  useEffect(() => {
    if (id && retailerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProjectPlanogramHierarchy(selectedFilter);
    }
  }, [id, retailerId]);


  // const handleHierarchyChange = (e) => {
  //   const value = e.target.value;
  //   setSelectedFilter(value);
  //   fetchProjectPlanogramHierarchy(value);
  // };

  // const handleHierarchyChange = (e) => {
  //   const value = e.target.value;
  //   setActiveHierarchy(value);
  //   setSelectedFilter(null); // clear selected filter when switching
  //   if (value === "category") {
  //     fetchProjectPlanogramHierarchy("reportproducthierarchy");
  //   } else if (value === "packagesize") {
  //     fetchProjectPlanogramHierarchy("reportpackagehierarchy");
  //   }
  //   else if (value === "brand") {
  //     fetchProjectPlanogramHierarchy("reportbrandhierarchy");
  //   }
  // };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = 280;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const cards = [
    { label: "Total Products", value: data?.totalproducts || 0 },
    {
      label: "Product Key Match",
      value: data?.totalmatched || 0,
      subLabel: "Unmatched",
      subValue: data?.totalunmatched || 0,
    },
    {
      label: "Category",
      value: data?.totalcategories || 0,
      subLabel: "From Planogram",
      subValue: data?.totalpogcategories || 0,
    },
    {
      label: "Manufacturers",
      value: data?.totalmanufacturers || 0,
      subLabel: "From Planogram",
      subValue: data?.totalpogmanufacturers || 0,
    },
    {
      label: "Sub Category",
      value: data?.totalsubcategories || 0,
      subLabel: "From Planogram",
      subValue: data?.totalpogsubcategories || 0,
    },
    {
      label: "Segment",
      value: data?.totalsegments || 0,
      subLabel: "From Subsegment",
      subValue: data?.totalpogsegments || 0,
    },
  ];

  const createProjRequest = async () => {
    try {
      const payload = { filetype: "PPU", projectid: params?.id }
      const data = await lambdaPost("/createrequest", payload);
      setCreateReqData(data)
      // dispatch(setCreateReq(data))
      return data
    } catch (err) {
      console.log(err, 'error');
      setCreateReqData([])
    }
    finally {

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
      setUpdateReqData([])
    } finally {
      setUpdtReqLoading(false);
    }
  };

  // Per-section errors are rendered inline so the page never blanks on partial failure.

  const getFilepath = async (filePath) => {
    try {
      // setFileCountLoading(true);
      // const key = filename;
      const data = await lambdaGet(`${filePath}`);
      return data;
    } catch (err) {
      console.error("Error getting file count:", err);
      throw err;
    } finally {
      // setFileCountLoading(false);
    }
  };

  const downloadDataFile = async (fName) => {
    try {
      toast.info("Starting download...", {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      const { downloadUrl } = await lambdaGet(`/downloadurl/${id}/${fName}`);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${fName}.csv`;
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
      toast.error("Download failed!");
    }
  };

  return (
    <AppLayout>
    <div className="relative w-full  flex flex-col gap-1 text-gray-600">
      <div className="relative w-full p-4 bg-gradient-to-b from-gray-50 to-white rounded-2xl shadow-sm">
        {totalsError && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <span>Failed to load totals: {totalsError}</span>
            <button onClick={fetchTotals} className="ml-4 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 cursor-pointer">
              Retry
            </button>
          </div>
        )}
        {!loading && !totalsError && (
          <button
            onClick={() => scroll("left")}
            className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:shadow-xl rounded-full p-2 z-10 border border-gray-200 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 cursor-pointer" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-hidden scrollbar-none scroll-smooth  w-full px-10 py-2"
        >          {loading ? (
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64  bg-gray-200 rounded-2xl animate-pulse"
            ></div>
          ))
        ) : (
          cards.map((card, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-64  bg-white shadow-lg hover:shadow-xl rounded-2xl flex flex-col justify-between p-4 border border-gray-100 transition-transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-4xl font-semibold text-gray-900">
                    {card.value}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{card.label}</p>
                </div>
                {/* {card.subLabel && (
                  <PieChart className="w-6 h-6 text-blue-500" />
                )} */}
              </div>

              {card.subLabel && (
                <div className="flex justify-between items-end text-sm text-gray-600">
                  <p className="text-sm text-gray-500">{card.subLabel}</p>
                  <span className="text-2xl font-semibold text-gray-900">
                    {card.subValue}
                  </span>
                </div>
              )}
            </div>
          ))
        )}

        </div>
        {!loading && !totalsError && (
          <button
            onClick={() => scroll("right")}
            className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:shadow-xl rounded-full p-2 z-10 border border-gray-200 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 cursor-pointer" />
          </button>
        )}
        <div className="pointer-events-none absolute bottom-0 left-0 h-full w-10 bg-gradient-to-r from-gray-50 to-transparent"></div>
        <div className="pointer-events-none absolute bottom-0 right-0 h-full w-10 bg-gradient-to-l from-gray-50 to-transparent"></div>

      </div>


      <div className="flex-1 w-full p-4 bg-gray-50 rounded-2xl ">
        <div className="flex justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span>Filter : </span>
            <select
              value={selectedFilter}
              onChange={
                (e) => {
                  const value = e.target.value;
                  setSelectedFilter(value);
                  fetchProjectPlanogramHierarchy(value);
                }}
              // handleHierarchyChange
              className=" border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            >
              <option value="reportproducthierarchy">Category</option>
              <option value="reportpackagehierarchy">Package Size</option>
              <option value="reportbrandhierarchy">Brand</option>
            </select>

            <select
              // disabled={!filterSub?.title}
              value={selectedSubFilter}
              onChange={(e) => setSelectedSubFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            >
              {filterSubLoading ? (
                <option>Loading...</option>
              ) :
                Array.isArray(filterSub) && filterSub.length > 0 ? (
                  <>
                    <option value="">-- Select --</option>
                    {filterSub?.map((item, idx) => (
                      <option key={idx} value={item.title}>
                        {item.title ? item.title : '-----'}
                      </option>
                    ))}
                  </>

                ) : (
                  <option value="">No options</option>
                )}
            </select>
            {hierarchyError && (
              <span className="text-xs text-red-600 flex items-center gap-2">
                Failed to load hierarchy: {hierarchyError}
                <button onClick={() => fetchProjectPlanogramHierarchy(selectedFilter)} className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700 cursor-pointer">
                  Retry
                </button>
              </span>
            )}
            <button
              onClick={() => setSelectedSubFilter('')}
              className="bg-gray-400 text-white px-3 py-1 rounded cursor-pointer hover:bg-gray-500 transition"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border bg-white border-gray-300 rounded-4xl px-4 py-1.5 pr-10  focus:border-blue-300 focus:ring-0 focus:outline-none"
                placeholder="UPC/Product Name"
              />

              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  <CloseCircleIcon className="w-4 h-4 text-gray-500 cursor-pointer" />
                </button>
              ) : <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                <SearchIcon className="w-4 h-4 text-gray-500 cursor-pointer" />
              </button>}

            </div>
            <div className="flex items-center gap-2">

              <div
                className="relative ">
                <span> Actions : </span>
              </div>
              <div
                className="relative ">
                <button className="px-4 "
                  onClick={() => {
                    setUploadModal(true)
                    createProjRequest()
                  }
                  }

                >
                  <UploadIcon className="w-5 h-5 cursor-pointer" />
                </button>
              </div>
              <div
                className="relative h-full flex items-center z-[200]"
                onMouseEnter={() => setDownloadDropdownOpen(true)}
                onMouseLeave={() => setDownloadDropdownOpen(false)}
              >
                <button className="px-4">
                  <DownloadIcon className="w-5 h-5 cursor-pointer" />
                </button>

                {downloadDropdownOpen && (
                  <div className="absolute top-full right-0 w-48 bg-white border border-gray-200 rounded shadow-lg z-[200]">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => downloadDataFile("PRD-U")} //pogproducts_unmatched
                    >
                      Unmatched Products
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => downloadDataFile("PRD-M")} //pogproducts_matched
                    >
                      Matched Products
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => downloadDataFile("PRD-A")} //pogproducts_all
                    >
                      All Products
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* <ProjectPlanogramTables
          data={[]}
          loading={projectProducLoading}
          sortConfig={null}
          onSort={() => { }}
        /> */}


        <div className="flex flex-col gap-2 flex-1">
          {productsError ? (
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>Failed to load products: {productsError}</span>
              <button onClick={fetchProjectProducts} className="ml-4 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 cursor-pointer">
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-auto  border border-gray-200 rounded-lg">
              <ProjectProductTble
                data={paginatedData}
                loading={projectProducLoading}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </div>
          )}
        </div>

      </div>
      {/* {!projectProducLoading && projectProductData?.length > 0 && (
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
      )} */}

      {totalRows > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center justify-between">
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
            <span className="text-sm text-gray-600 mr-2">Page {currentPage} of {totalPages}</span>

            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronsLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              <ChevronsRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center text-gray-500">No rows to display</div>
      )}
      {/* <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        maxWidth="max-w-2xl"
        maxHeight="h-[400px]"
      >

      </Modal> */}

      {
        uploadModal &&
        <UploadProductsModal
          open={uploadModal}
          setOpen={setUploadModal}
          updateRequest={updateRequest}
          createProjRequest={createProjRequest}
          fetchProjectReqList={fetchProjectProducts}
          createReqData={createReqData}
          typeToUpload='files'
        />
      }
    </div >
    </AppLayout>
  );
};

export default SwipeCards;
