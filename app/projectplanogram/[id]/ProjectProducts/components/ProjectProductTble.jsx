'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import { useParams } from "next/navigation";
import { lambdaGet } from "@/app/lamda/lambdaClient";

const ProjectProductTble = ({ data, loading, sortConfig, onSort }) => {
    const [productDetailsModal, setProductDetailsModal] = useState(false)
    const [productDetailsData, setProductDetailsData] = useState(null)
    const [openPanel, setOpenPanel] = useState(0);

    const [planogramData, setPlanogramData] = useState([]);
    const [planogramLoading, setPlanogramLoading] = useState(false);

    const [storeData, setStoreData] = useState([]);
    const [storeLoading, setStoreLoading] = useState(false);
    const params = useParams()

    const { id } = params

    // The API uses the literal string "<NA>" for empty source values.  Convert
    // it to an empty value before rendering so it follows the table's existing
    // missing-data treatment rather than showing the raw placeholder.
    const normalizeMissingValues = (product) => Object.fromEntries(
        Object.entries(product).map(([key, value]) => [
            key,
            typeof value === "string" && value.trim().toUpperCase() === "<NA>" ? null : value,
        ])
    );

    const defaultPlanogramColumns = [
        { title: "Planogram Name", dataIndex: "planogramname" },
        { title: "PSA File", dataIndex: "psafile" },
        { title: "Position Count", dataIndex: "positioncount" },
        { title: "Total Facings", dataIndex: "totalfacings" },
        { title: "Total Capacity", dataIndex: "totalcaoacity" },

    ];

    const defaultStoreColumns = [
        { title: "Store Name", dataIndex: "name" },
        { title: "Store Number", dataIndex: "storenumber" },
        { title: "Planogram Count", dataIndex: "planogramcount" },
    ];

    const planogramCols = defaultPlanogramColumns;
    const storeCols = defaultStoreColumns;

    const SortIcon = ({ columnKey }) => {

        const isActive = sortConfig?.key === columnKey && sortConfig.direction;
        if (!isActive) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 text-blue-600 cursor-pointer" />;
        }
        return <ArrowDown className="w-4 h-4 text-blue-600 cursor-pointer" />;
    };


    const getSortTitle = (columnKey) => {
        if (sortConfig.key !== columnKey) return "Click to sort";
        if (!sortConfig.direction) return "Sorting cancelled";
        return sortConfig.direction === "desc" ? "Descending" : "Ascending";
    };


    const handleClose = () => {
        setProductDetailsModal(false)
    }


    const handleModalOpen = (item) => {

        setProductDetailsModal(true)
        setProductDetailsData(item)
    }

    const fetchPlanograms = async (upc) => {
        try {
            setPlanogramLoading(true);
            const data = await lambdaGet(`/getupcpogstoredata/${id}/${upc}`);
            setPlanogramData(data || []);
            if (!data || data.error) {
                console.log(data.error);
                setPlanogramData([])
                return;
            }

        } catch (err) {
            console.error("Planogram API error:", err);
        } finally {
            setPlanogramLoading(false);
        }
    };

    const fetchStores = async (upc) => {
        try {
            setStoreLoading(true);
            const data = await lambdaGet(`/getupcstoredata/${id}/${upc}`);
            setStoreData(data || []);
            if (!data || data.error) {
                console.log(data.error);

                return;
            }

        } catch (err) {
            console.error("Store API error:", err);
        } finally {
            setStoreLoading(false);
        }
    };

    const togglePanel = (panel) => {
        const newPanel = openPanel === panel ? null : panel;
        setOpenPanel(newPanel);

        // if (newPanel === 4) {
        //     fetchPlanograms(productDetailsData?.UPC);
        // }

        // if (newPanel === 5) {
        //     fetchStores(productDetailsData?.UPC);
        // }
    };


    return (
        <>

            <div className="flex-1 overflow-auto h-full">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative h-full">
                    <div className="overflow-auto h-[50vh]">
                        <table className="w-full border-separate border-spacing-0 min-w-max ">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-[5]">

                                <tr className="text-center bg-blue-50">
                                    <th colSpan="2" className="bg-gray-50 border-b sticky left-0"></th>
                                    {/* <th colSpan="2" className="bg-gray-50 border-b sticky left-0"></th>
                                        <th colSpan="1" className="bg-gray-50 border-b sticky left-0"></th> */}


                                    <th colSpan="12" className="bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 border-b">
                                        Master
                                    </th>

                                    <th colSpan="5" className="bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 border-b">
                                        Planogram
                                    </th>

                                    <th colSpan="10" className="bg-gray-50 border-b"></th>
                                </tr>

                                <tr>
                                    <th onClick={() => onSort('IsMatched')}
                                        title={getSortTitle("IsMatched")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 z-10 bg-gray-50 w-32">
                                        <div className="flex items-center gap-1">
                                            Matched
                                            {!loading && <SortIcon columnKey="IsMatched" />}
                                        </div>
                                    </th>

                                    <th onClick={() => onSort('UPC')}
                                        title={getSortTitle("UPC")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-32 bg-gray-50 w-48 border-r border-gray-200 z-10">
                                        <div className="flex items-center gap-1">
                                            UPC
                                            {!loading && <SortIcon columnKey="UPC" />}
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('MasterUPC')}
                                        title={getSortTitle("MasterUPC")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Master UPC <SortIcon columnKey="MasterUPC" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('MaterialIds')}
                                        title={getSortTitle("MaterialIds")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Material ID <SortIcon columnKey="MaterialIds" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('CasePack')}
                                        title={getSortTitle("CasePack")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Case Pack <SortIcon columnKey="CasePack" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('MultiFlag')}
                                        title={getSortTitle("MultiFlag")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900  bg-gray-50 w-48 border-r border-gray-200 z-10">
                                        <div className="flex items-center gap-1">
                                            Multi Flag <SortIcon columnKey="MultiFlag" />
                                        </div>
                                    </th>
                                    {/* <th onClick={() => onSort('MaterialIds')}
                                        title={getSortTitle("MaterialIds")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-48 border-r border-gray-200 z-10">
                                        <div className="flex items-center gap-1">
                                            Material upcs <SortIcon columnKey="MaterialIds" />
                                        </div>
                                    </th> */}




                                    {[
                                        { item: "Product Name", sort: "ProductName" },
                                        { item: "Product Manufacturer", sort: "ProductManufacturer" },
                                        { item: "Category", sort: "Category" },
                                        { item: "Sub Category", sort: "SubCategory" },
                                        { item: "Segment", sort: "Segment" },
                                        { item: "Sub Segment", sort: "SubSegment" },
                                        { item: "Package", sort: "Package" },
                                        { item: "Brand", sort: "Brand" },
                                    ].map((col) => (
                                        <th
                                            key={col.sort}
                                            onClick={() => onSort(col.sort)}
                                            title={getSortTitle(col.sort)}
                                            className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none"
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.item}
                                                {!loading && <SortIcon columnKey={col.sort} />}
                                            </div>
                                        </th>
                                    ))}

                                    {[
                                        { item: "Product Name", sort: "ProductNamePlanogram" },
                                        { item: "Product Manufacturer", sort: "ProductManufacturerPlanogram" },
                                        { item: "Category", sort: "CategoryPlanogram" },

                                        { item: "Sub Category", sort: "SubCategoryPlanogram" },
                                        { item: "Brand", sort: "BrandPlanogram" },


                                        // "Package",

                                    ].map((col, index) => (
                                        <th key={`p-${index}`}
                                            onClick={() => onSort(col.sort)}
                                            title={getSortTitle(col.sort)}
                                            className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            <div className="flex items-center gap-1">
                                                {col?.item}
                                                <SortIcon columnKey={col.sort} />
                                            </div>
                                        </th>
                                    ))}

                                    {[
                                        { item: "Desc 1", sort: "Desc1" },
                                        { item: "Desc 2", sort: "Desc2" },
                                        { item: "Desc 3", sort: "Desc3" },
                                        { item: "Desc 4", sort: "Desc4" },
                                        { item: "Desc 5", sort: "Desc5" },
                                        { item: "Value 1", sort: "Value1" },
                                        { item: "Value 2", sort: "Value2" },
                                        { item: "Value 3", sort: "Value3" },
                                        { item: "Value 4", sort: "Value4" },
                                        { item: "Value 5", sort: "Value5" },
                                    ].map((col, idx) => (
                                        <th key={`d-${idx}`}
                                            onClick={() => onSort(col?.sort)}
                                            title={getSortTitle(col?.sort)}
                                            className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                            <div className="flex items-center gap-1">
                                                {col?.item}
                                                <SortIcon columnKey={col?.sort} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>

                            </thead>
                            <tbody className="divide-y divide-gray-200 -z-0">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="h-[250px] text-center">
                                            <LoadingSpinner text="Fetching requests..." />
                                        </td>
                                    </tr>
                                ) : !data || data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10">
                                            No data found
                                        </td>
                                    </tr>
                                ) :
                                    data?.map((rawItem, i) => {
                                        const item = normalizeMissingValues(rawItem);

                                        return (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-600 sticky left-0 bg-white w-32 hover:bg-gray-50">
                                                {item?.IsMatched === 'True' ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-green-700 bg-green-100">
                                                        Matched
                                                    </span>
                                                ) : item?.IsMatched === 'False' ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-red-700 bg-red-100">
                                                        Not Matched
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-sm">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-32 bg-white w-48 border-r  border-gray-200 whitespace-normal break-words hover:bg-gray-50">
                                                {<span
                                                    onClick={() => {

                                                        handleModalOpen(item)
                                                    }}
                                                    className="font-mono text-blue-400 cursor-pointer">{item?.UPC}</span>
                                                    || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-600 w-48">
                                                {item?.MasterUPC ? (
                                                    <span className="font-mono text-gray-800">{item.MasterUPC}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Master UPC</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 w-48">
                                                {item?.MaterialIds ? (
                                                    <span className="font-mono text-gray-800">{item.MaterialIds}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 w-32">
                                                {item?.CasePack ? (
                                                    <span>{item.CasePack}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            {/* temporary added desc4 into material upc flag, will correct later, */}
                                            <td className="px-4 py-3 text-sm text-gray-600 w-48">
                                                {/* {item?.Desc4 ? (
                                                    <span className="font-mono text-gray-800">{item.Desc4}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Material upc flag</span>
                                                )} */}
                                                {item?.MultiFlag == "TRUE" || item?.MultiFlag == "true" ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-green-700 bg-green-100">
                                                        True
                                                    </span>
                                                ) : item?.MultiFlag == "FALSE" || item?.MultiFlag == "fasle" ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold  bg-blue-100">
                                                        False
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 text-sm">N/A</span>
                                                )}
                                            </td>

                                            {/* temporary added desc3 into material upc will correct later*/}
                                            {/* <td className="px-4 py-3 text-sm text-gray-600 w-48">
                                                {item?.MaterialIds ? (
                                                    <span className="font-mono text-gray-800">{item.MaterialIds}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Material upcs</span>
                                                )}
                                            </td> */}

                                            <td className="px-4 py-3 text-sm text-gray-600 w-48 wrap-break-word">
                                                {item?.ProductName ? (
                                                    <span className="font-medium">{item.ProductName}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Product Name</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.ProductManufacturer ? (
                                                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium truncate max-w-[230px]">
                                                        {item.ProductManufacturer}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                                                        No Manufacturer Data
                                                    </span>
                                                )}                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {item?.Category ? (
                                                    <span>{item.Category}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.SubCategory ? (
                                                    <span>{item.SubCategory}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No SubCategory Data</span>
                                                )}                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Segment ? (
                                                    <span>{item.Segment}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Segment Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Subsegment ? (
                                                    <span>{item.Subsegment}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Sub Segment Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Package ? (
                                                    <span>{item.Package}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Package Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Brand ? (
                                                    <span>{item.Brand}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Brand Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 w-48 wrap-break-word">
                                                {item?.ProductNamePlanogram ? (
                                                    <span>{item.ProductNamePlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Name Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.ProductManufacturerPlanogram ? (
                                                    <span>{item.ProductManufacturerPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Manufacturer Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.CategoryPlanogram ? (
                                                    <span>{item.CategoryPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.SubCategoryPlanogram ? (
                                                    <span>{item.SubCategoryPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Sub Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.BrandPlanogram ? (
                                                    <span>{item.BrandPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Sub Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Desc1 ? (
                                                    <span>{item.Desc1}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Desc2 ? (
                                                    <span>{item.Desc2}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] whitespace-normal break-words">
                                                {item?.Desc3 ? (
                                                    <span>{item.Desc3}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Desc4 ? (
                                                    <span>{item.Desc4}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Desc5 ? (
                                                    <span>{item.Desc5}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Value1 ? (
                                                    <span>{item.Value1}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>

                                            {/* hell */}
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Value2 ? (
                                                    <span>{item.Value2}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Value3 ? (
                                                    <span>{item.Value3}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Value4 ? (
                                                    <span>{item.Value4}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.Value5 ? (
                                                    <span>{item.Value5}</span>
                                                ) : (
                                                    <span className="text-gray-500 font-medium">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* )} */}

            <Modal isOpen={productDetailsModal} onClose={handleClose} maxWidth="max-w-4xl" maxHeight="h-[500px]">
                {<>

                    <div className="h-full flex flex-col">
                        <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">

                        </div>
                        <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
                            <div className="mt-8 bg-white rounded-xl shadow border border-gray-100">
                                <div className="w-full border-b pb-3 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Is Matched</span>

                                    {productDetailsData?.IsMatched === "True" ? (
                                        <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                            Matched
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                            Not Matched
                                        </span>
                                    )}
                                </div>
                                <div className="w-full grid grid-cols-2">
                                    <div className=" py-4 border-b">
                                        <span className="text-gray-500 text-sm">Product UPC</span>
                                        <div className="mt-1">
                                            {productDetailsData?.UPC ? (
                                                <p className="text-lg font-semibold">{productDetailsData?.UPC}</p>
                                            ) : (
                                                <p className="text-red-600">No Product UPC</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full py-4 border-b">
                                        <span className="text-gray-500 text-sm">Master UPC</span>
                                        <div className="mt-1">
                                            {productDetailsData?.MasterUPC ? (
                                                <p className="text-lg font-semibold">{productDetailsData?.MasterUPC}</p>
                                            ) : (
                                                <p className="text-red-600">No Master UPC</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full py-4 border-b">
                                        <span className="text-gray-500 text-sm">Product Name</span>
                                        <div className="mt-1">
                                            {productDetailsData?.ProductName ? (
                                                <p className="text-lg font-semibold">{productDetailsData?.ProductName}</p>
                                            ) : (
                                                <p className="text-red-600">No Product Name</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full py-4 border-b">
                                        <span className="text-gray-500 text-sm">Product Name Planogram</span>
                                        <div className="mt-1">
                                            {productDetailsData?.ProductNamePlanogram ? (
                                                <p className="text-lg font-semibold">{productDetailsData?.ProductNamePlanogram}</p>
                                            ) : (
                                                <p className="text-red-600">No Product Name Planogram</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4">

                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => togglePanel(1)}
                                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left"
                                    >
                                        <span className="font-medium">From Master Data</span>
                                        <span className="cursor-pointer">{openPanel === 1 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 1 && (
                                        <div className="px-4 py-3 bg-white">
                                            {[
                                                ["Master UPC", productDetailsData?.MasterUPC],
                                                ["Product Name", productDetailsData?.ProductName],
                                                ["Product Manufacturer", productDetailsData?.ProductManufacturer],
                                                ["Category", productDetailsData?.Category],
                                                ["Sub Category", productDetailsData?.SubCategory],
                                                ["Segment", productDetailsData?.Segment],
                                                ["Brand", productDetailsData?.Brand],
                                                ["Supplier", productDetailsData?.Supplier],
                                                ["Sub Segment", productDetailsData?.Subsegment],
                                                ["Package", productDetailsData?.Package],
                                            ].map(([label, value], i) => (
                                                <div key={i} className="flex w-full border-b py-2 last:border-0">
                                                    <div className="w-1/3 text-gray-500">{label}</div>
                                                    <div className="w-2/3 font-medium">
                                                        {value ? value : <span className="text-red-600">No {label}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => togglePanel(2)}
                                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left"
                                    >
                                        <span className="font-medium">From Planogram Data</span>
                                        <span className="cursor-pointer">{openPanel === 2 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 2 && (
                                        <div className="px-4 py-3 bg-white">
                                            {[
                                                ["Product Name Planogram", productDetailsData?.ProductNamePlanogram],
                                                ["Manufacturer Planogram", productDetailsData?.ProductManufacturerPlanogram],
                                                ["Category Planogram", productDetailsData?.CategoryPlanogram],
                                                ["Sub Category Planogram", productDetailsData?.SubCategoryPlanogram],
                                                ["Brand Planogram", productDetailsData?.BrandPlanogram],
                                                ["Brand Family", productDetailsData?.BrandFamily],
                                            ].map(([label, value], i) => (
                                                <div key={i} className="flex w-full border-b py-2 last:border-0">
                                                    <div className="w-1/3 text-gray-500">{label}</div>
                                                    <div className="w-2/3 font-medium">
                                                        {value ? value : <span className="text-red-600">No {label}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => togglePanel(3)}
                                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left"
                                    >
                                        <span className="font-medium">Description and Values</span>
                                        <span className="cursor-pointer">{openPanel === 3 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 3 && (
                                        <div className="px-4 py-3 bg-white">
                                            {[
                                                ["Description 1", productDetailsData?.Desc1],
                                                ["Description 2", productDetailsData?.Desc2],
                                                ["Description 3", productDetailsData?.Desc3],
                                                ["Description 4", productDetailsData?.Desc4],
                                                ["Description 5", productDetailsData?.Desc5],
                                                ["Value 1", productDetailsData?.Value1],
                                                ["Value 2", productDetailsData?.Value2],
                                                ["Value 3", productDetailsData?.Value3],
                                                ["Value 4", productDetailsData?.Value4],
                                                ["Value 5", productDetailsData?.Value5],
                                            ].map(([label, value], i) => (
                                                <div key={i} className="flex w-full border-b py-2 last:border-0">
                                                    <div className="w-1/3 text-gray-500">{label}</div>
                                                    <div className="w-2/3 font-medium">
                                                        {value ? value : <span className="text-red-600">No {label}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => togglePanel(4)}
                                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left"
                                    >
                                        <span className="font-medium">Show Planograms Contains Product</span>
                                        <span className="cursor-pointer">{openPanel === 4 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 4 && (
                                        <div className="px-4 py-3 bg-white">
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-gray-100 border-b">
                                                        <tr>
                                                            {defaultPlanogramColumns.map((col) => (
                                                                <th key={col.dataIndex} className="px-4 py-2 text-left font-semibold">
                                                                    {col.title}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            planogramLoading ?
                                                                <td className="px-4 py-4 bg-gray-100 animate-pulse" colSpan={1}>

                                                                </td>
                                                                :

                                                                !planogramData?.planogramlist || planogramData.planogramlist.length === 0 ? (
                                                                    <tr>
                                                                        <td className="px-4 py-4 text-gray-500" colSpan={1}>
                                                                            No data available
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    planogramData?.planogramlist?.map((item, idx) => (
                                                                        <tr key={idx} className="border-b hover:bg-gray-50">

                                                                            <td key={col.dataIndex} className="px-4 py-2">
                                                                                {item[col.dataIndex]}
                                                                            </td>

                                                                        </tr>
                                                                    ))
                                                                )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => togglePanel(5)}
                                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left"
                                    >
                                        <span className="font-medium">Show Stores Contains Product</span>
                                        <span className="cursor-pointer">{openPanel === 5 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 5 && (
                                        <div className="px-4 py-3 bg-white">
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-gray-100 border-b">
                                                        <tr>
                                                            {defaultStoreColumns.map((col) => (
                                                                <th key={col.dataIndex} className="px-4 py-2 text-left font-semibold">
                                                                    {col.title}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {storeLoading ?
                                                            <tr>
                                                                <td className="px-4 py-4 bg-gray-100 animate-pulse text-center" colSpan={defaultStoreColumns.length}>
                                                                    Loading...
                                                                </td>
                                                            </tr>
                                                            :
                                                            !storeData?.storelist || storeData.storelist.length === 0
                                                                ? (
                                                                    <tr>
                                                                        <td className="px-4 py-4 text-gray-500" colSpan={1}>
                                                                            No data available
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    storeData?.storelist?.map((item, idx) => (
                                                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                                                            <td key={col.dataIndex} className="px-4 py-2">
                                                                                {item[col.dataIndex]}
                                                                            </td>

                                                                        </tr>
                                                                    ))
                                                                )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                </>}
            </Modal>
        </>
    );
};

export default ProjectProductTble;
