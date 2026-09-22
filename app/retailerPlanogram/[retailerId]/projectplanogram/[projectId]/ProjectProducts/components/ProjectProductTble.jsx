'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import { useParams } from "next/navigation";
import { lambdaGet } from "@/app/lamda/lambdaClient";

const ProjectProductTble = ({ data, loading, sortConfig, onSort, theme }) => {
    const {bg,bgSub,border,textPri,textSec,hover,accent,isDark}=theme||{};
    const [productDetailsModal, setProductDetailsModal] = useState(false)
    const [productDetailsData, setProductDetailsData] = useState(null)
    const [openPanel, setOpenPanel] = useState(0);

    const [planogramData, setPlanogramData] = useState([]);
    const [planogramLoading, setPlanogramLoading] = useState(false);

    const [storeData, setStoreData] = useState([]);
    const [storeLoading, setStoreLoading] = useState(false);
    const { retailerId, projectId } = useParams();

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
            return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{color: textSec||"#9ca3af"}} />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 cursor-pointer" style={{color: accent||"#334155"}} />;
        }
        return <ArrowDown className="w-4 h-4 cursor-pointer" style={{color: accent||"#334155"}} />;
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
            const data = await lambdaGet(`/getupcpogstoredata/${projectId}/${upc}`);
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
            const data = await lambdaGet(`/getupcstoredata/${projectId}/${upc}`);
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
    };


    return (
        <>

            <div className="flex-1 overflow-auto h-full">
                <div className="rounded-lg border overflow-hidden relative h-full" style={{backgroundColor: bg||"#fff", borderColor: border||"#e5e7eb"}}>
                    <div className="overflow-auto h-[50vh]">
                        <table className="w-full border-separate border-spacing-0 min-w-max ">
                            <thead className="border-b sticky top-0 z-[5]" style={{backgroundColor: bgSub||"#f9fafb", borderColor: border||"#e5e7eb"}}>

                                <tr className="text-center" style={{backgroundColor: bgSub||"#f9fafb"}}>
                                    <th colSpan="2" className="border-b sticky left-0" style={{backgroundColor: bgSub||"#f9fafb", borderColor: border||"#e5e7eb"}}></th>

                                    <th colSpan="12" className="bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 border-b">
                                        Master
                                    </th>

                                    <th colSpan="5" className="bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 border-b">
                                        Planogram
                                    </th>

                                    <th colSpan="10" className="border-b" style={{backgroundColor: bgSub||"#f9fafb", borderColor: border||"#e5e7eb"}}></th>
                                </tr>

                                <tr>
                                    <th onClick={() => onSort('IsMatched')}
                                        title={getSortTitle("IsMatched")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-0 z-10 w-32" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}>
                                        <div className="flex items-center gap-1">
                                            Matched
                                            {!loading && <SortIcon columnKey="IsMatched" />}
                                        </div>
                                    </th>

                                    <th onClick={() => onSort('UPC')}
                                        title={getSortTitle("UPC")}
                                        className="px-4 py-3 text-left text-sm font-semibold sticky left-32 w-48 border-r z-10" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937", borderColor: border||"#e5e7eb"}}>
                                        <div className="flex items-center gap-1">
                                            UPC
                                            {!loading && <SortIcon columnKey="UPC" />}
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('MasterUPC')}
                                        title={getSortTitle("MasterUPC")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}>
                                        <div className="flex items-center gap-1">
                                            Master UPC <SortIcon columnKey="MasterUPC" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('MaterialIds')}
                                        title={getSortTitle("MaterialIds")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}>
                                        <div className="flex items-center gap-1">
                                            Material ID <SortIcon columnKey="MaterialIds" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('CasePack')}
                                        title={getSortTitle("CasePack")}
                                        className="px-4 py-3 text-left text-sm font-semibold" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}>
                                        <div className="flex items-center gap-1">
                                            Case Pack <SortIcon columnKey="CasePack" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('MultiFlag')}
                                        title={getSortTitle("MultiFlag")}
                                        className="px-4 py-3 text-left text-sm font-semibold w-48 border-r z-10" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937", borderColor: border||"#e5e7eb"}}>
                                        <div className="flex items-center gap-1">
                                            Multi Flag <SortIcon columnKey="MultiFlag" />
                                        </div>
                                    </th>


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
                                            className="px-4 py-3 text-left text-sm font-semibold cursor-pointer select-none" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}
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


                                    ].map((col, index) => (
                                        <th key={`p-${index}`}
                                            onClick={() => onSort(col.sort)}
                                            title={getSortTitle(col.sort)}
                                            className="px-4 py-3 text-left text-sm font-semibold" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}>
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
                                            className="px-4 py-3 text-left text-sm font-semibold" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}>
                                            <div className="flex items-center gap-1">
                                                {col?.item}
                                                <SortIcon columnKey={col?.sort} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>

                            </thead>
                            <tbody className="divide-y -z-0" style={{borderColor: border||"#e5e7eb"}}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="h-[250px] text-center" style={{color: textSec||"#6b7280"}}>
                                            <LoadingSpinner text="Fetching requests..." />
                                        </td>
                                    </tr>
                                ) : !data || data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10" style={{color: textSec||"#6b7280"}}>
                                            No data found
                                        </td>
                                    </tr>
                                ) :
                                    data?.map((rawItem, i) => {
                                        const item = normalizeMissingValues(rawItem);

                                        return (
                                        <tr key={i} className="transition-colors" style={{borderColor: border||"#e5e7eb"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor="transparent"}>
                                            <td className="px-4 py-3 text-sm sticky left-0 w-32" style={{backgroundColor: bg||"#fff", color: textSec||"#6b7280"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bg||"#fff"}>
                                                {item?.IsMatched === 'True' ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-green-700 bg-green-100">
                                                        Matched
                                                    </span>
                                                ) : item?.IsMatched === 'False' ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-red-700 bg-red-100">
                                                        Not Matched
                                                    </span>
                                                ) : (
                                                    <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-medium sticky left-32 w-48 border-r whitespace-normal break-words" style={{backgroundColor: bg||"#fff", color: textPri||"#1f2937", borderColor: border||"#e5e7eb"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bg||"#fff"}>
                                                {<span
                                                    onClick={() => {

                                                        handleModalOpen(item)
                                                    }}
                                                    className="font-mono cursor-pointer" style={{color: accent||"#2563eb"}}>{item?.UPC}</span>
                                                    || <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm w-48" style={{color: textSec||"#6b7280"}}>
                                                {item?.MasterUPC ? (
                                                    <span className="font-mono" style={{color: textPri||"#1f2937"}}>{item.MasterUPC}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Master UPC</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm w-48" style={{color: textSec||"#6b7280"}}>
                                                {item?.MaterialIds ? (
                                                    <span className="font-mono" style={{color: textPri||"#1f2937"}}>{item.MaterialIds}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm w-32" style={{color: textSec||"#6b7280"}}>
                                                {item?.CasePack ? (
                                                    <span>{item.CasePack}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm w-48" style={{color: textSec||"#6b7280"}}>
                                                {item?.MultiFlag == "TRUE" || item?.MultiFlag == "true" ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-green-700 bg-green-100">
                                                        True
                                                    </span>
                                                ) : item?.MultiFlag == "FALSE" || item?.MultiFlag == "fasle" ? (
                                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold  bg-blue-100">
                                                        False
                                                    </span>
                                                ) : (
                                                    <span className="text-sm" style={{color: textSec||"#9ca3af"}}>N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm w-48 wrap-break-word" style={{color: textSec||"#6b7280"}}>
                                                {item?.ProductName ? (
                                                    <span className="font-medium" style={{color: textPri||"#1f2937"}}>{item.ProductName}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Product Name</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.ProductManufacturer ? (
                                                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium truncate max-w-[230px]">
                                                        {item.ProductManufacturer}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                                                        No Manufacturer Data
                                                    </span>
                                                )}                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Category ? (
                                                    <span>{item.Category}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.SubCategory ? (
                                                    <span>{item.SubCategory}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No SubCategory Data</span>
                                                )}                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Segment ? (
                                                    <span>{item.Segment}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Segment Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Subsegment ? (
                                                    <span>{item.Subsegment}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Sub Segment Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Package ? (
                                                    <span>{item.Package}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Package Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Brand ? (
                                                    <span>{item.Brand}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Brand Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm w-48 wrap-break-word" style={{color: textSec||"#6b7280"}}>
                                                {item?.ProductNamePlanogram ? (
                                                    <span>{item.ProductNamePlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Name Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.ProductManufacturerPlanogram ? (
                                                    <span>{item.ProductManufacturerPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Manufacturer Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.CategoryPlanogram ? (
                                                    <span>{item.CategoryPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.SubCategoryPlanogram ? (
                                                    <span>{item.SubCategoryPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Sub Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.BrandPlanogram ? (
                                                    <span>{item.BrandPlanogram}</span>
                                                ) : (
                                                    <span className="text-red-500 font-medium">No Sub Category Data</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Desc1 ? (
                                                    <span>{item.Desc1}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Desc2 ? (
                                                    <span>{item.Desc2}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm max-w-[200px] whitespace-normal break-words" style={{color: textSec||"#6b7280"}}>
                                                {item?.Desc3 ? (
                                                    <span>{item.Desc3}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Desc4 ? (
                                                    <span>{item.Desc4}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Desc5 ? (
                                                    <span>{item.Desc5}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Value1 ? (
                                                    <span>{item.Value1}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Value2 ? (
                                                    <span>{item.Value2}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Value3 ? (
                                                    <span>{item.Value3}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Value4 ? (
                                                    <span>{item.Value4}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm" style={{color: textSec||"#6b7280"}}>
                                                {item?.Value5 ? (
                                                    <span>{item.Value5}</span>
                                                ) : (
                                                    <span className="font-medium" style={{color: textSec||"#6b7280"}}>N/A</span>
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

            <Modal isOpen={productDetailsModal} onClose={handleClose} maxWidth="max-w-4xl" maxHeight="h-[500px]">
                {<>

                    <div className="h-full flex flex-col" style={{backgroundColor: bg||"#fff"}}>
                        <div className="px-4 py-4 border-b flex-shrink-0" style={{borderColor: border||"#e5e7eb"}}>

                        </div>
                        <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
                            <div className="mt-8 rounded-xl shadow border" style={{backgroundColor: bg||"#fff", borderColor: border||"#e5e7eb"}}>
                                <div className="w-full border-b pb-3 flex justify-between items-center" style={{borderColor: border||"#e5e7eb"}}>
                                    <span className="text-sm" style={{color: textSec||"#6b7280"}}>Is Matched</span>

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
                                    <div className=" py-4 border-b" style={{borderColor: border||"#e5e7eb"}}>
                                        <span className="text-sm" style={{color: textSec||"#6b7280"}}>Product UPC</span>
                                        <div className="mt-1">
                                            {productDetailsData?.UPC ? (
                                                <p className="text-lg font-semibold" style={{color: textPri||"#1f2937"}}>{productDetailsData?.UPC}</p>
                                            ) : (
                                                <p className="text-red-600">No Product UPC</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full py-4 border-b" style={{borderColor: border||"#e5e7eb"}}>
                                        <span className="text-sm" style={{color: textSec||"#6b7280"}}>Master UPC</span>
                                        <div className="mt-1">
                                            {productDetailsData?.MasterUPC ? (
                                                <p className="text-lg font-semibold" style={{color: textPri||"#1f2937"}}>{productDetailsData?.MasterUPC}</p>
                                            ) : (
                                                <p className="text-red-600">No Master UPC</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full py-4 border-b" style={{borderColor: border||"#e5e7eb"}}>
                                        <span className="text-sm" style={{color: textSec||"#6b7280"}}>Product Name</span>
                                        <div className="mt-1">
                                            {productDetailsData?.ProductName ? (
                                                <p className="text-lg font-semibold" style={{color: textPri||"#1f2937"}}>{productDetailsData?.ProductName}</p>
                                            ) : (
                                                <p className="text-red-600">No Product Name</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full py-4 border-b" style={{borderColor: border||"#e5e7eb"}}>
                                        <span className="text-sm" style={{color: textSec||"#6b7280"}}>Product Name Planogram</span>
                                        <div className="mt-1">
                                            {productDetailsData?.ProductNamePlanogram ? (
                                                <p className="text-lg font-semibold" style={{color: textPri||"#1f2937"}}>{productDetailsData?.ProductNamePlanogram}</p>
                                            ) : (
                                                <p className="text-red-600">No Product Name Planogram</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4">

                                <div className="border rounded-lg overflow-hidden" style={{borderColor: border||"#e5e7eb"}}>
                                    <button
                                        onClick={() => togglePanel(1)}
                                        className="w-full flex justify-between items-center px-4 py-3 text-left" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}
                                        onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f3f4f6"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bgSub||"#f9fafb"}
                                    >
                                        <span className="font-medium">From Master Data</span>
                                        <span className="cursor-pointer">{openPanel === 1 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 1 && (
                                        <div className="px-4 py-3" style={{backgroundColor: bg||"#fff"}}>
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
                                                <div key={i} className="flex w-full border-b py-2 last:border-0" style={{borderColor: border||"#e5e7eb"}}>
                                                    <div className="w-1/3" style={{color: textSec||"#6b7280"}}>{label}</div>
                                                    <div className="w-2/3 font-medium" style={{color: textPri||"#1f2937"}}>
                                                        {value ? value : <span className="text-red-600">No {label}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden" style={{borderColor: border||"#e5e7eb"}}>
                                    <button
                                        onClick={() => togglePanel(2)}
                                        className="w-full flex justify-between items-center px-4 py-3 text-left" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}
                                        onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f3f4f6"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bgSub||"#f9fafb"}
                                    >
                                        <span className="font-medium">From Planogram Data</span>
                                        <span className="cursor-pointer">{openPanel === 2 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 2 && (
                                        <div className="px-4 py-3" style={{backgroundColor: bg||"#fff"}}>
                                            {[
                                                ["Product Name Planogram", productDetailsData?.ProductNamePlanogram],
                                                ["Manufacturer Planogram", productDetailsData?.ProductManufacturerPlanogram],
                                                ["Category Planogram", productDetailsData?.CategoryPlanogram],
                                                ["Sub Category Planogram", productDetailsData?.SubCategoryPlanogram],
                                                ["Brand Planogram", productDetailsData?.BrandPlanogram],
                                                ["Brand Family", productDetailsData?.BrandFamily],
                                            ].map(([label, value], i) => (
                                                <div key={i} className="flex w-full border-b py-2 last:border-0" style={{borderColor: border||"#e5e7eb"}}>
                                                    <div className="w-1/3" style={{color: textSec||"#6b7280"}}>{label}</div>
                                                    <div className="w-2/3 font-medium" style={{color: textPri||"#1f2937"}}>
                                                        {value ? value : <span className="text-red-600">No {label}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden" style={{borderColor: border||"#e5e7eb"}}>
                                    <button
                                        onClick={() => togglePanel(3)}
                                        className="w-full flex justify-between items-center px-4 py-3 text-left" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}
                                        onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f3f4f6"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bgSub||"#f9fafb"}
                                    >
                                        <span className="font-medium">Description and Values</span>
                                        <span className="cursor-pointer">{openPanel === 3 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 3 && (
                                        <div className="px-4 py-3" style={{backgroundColor: bg||"#fff"}}>
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
                                                <div key={i} className="flex w-full border-b py-2 last:border-0" style={{borderColor: border||"#e5e7eb"}}>
                                                    <div className="w-1/3" style={{color: textSec||"#6b7280"}}>{label}</div>
                                                    <div className="w-2/3 font-medium" style={{color: textPri||"#1f2937"}}>
                                                        {value ? value : <span className="text-red-600">No {label}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden" style={{borderColor: border||"#e5e7eb"}}>
                                    <button
                                        onClick={() => togglePanel(4)}
                                        className="w-full flex justify-between items-center px-4 py-3 text-left" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}
                                        onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f3f4f6"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bgSub||"#f9fafb"}
                                    >
                                        <span className="font-medium">Show Planograms Contains Product</span>
                                        <span className="cursor-pointer">{openPanel === 4 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 4 && (
                                        <div className="px-4 py-3" style={{backgroundColor: bg||"#fff"}}>
                                            <div className="overflow-x-auto border rounded-lg" style={{borderColor: border||"#e5e7eb"}}>
                                                <table className="min-w-full text-sm">
                                                    <thead className="border-b" style={{backgroundColor: bgSub||"#f9fafb", borderColor: border||"#e5e7eb"}}>
                                                        <tr>
                                                            {defaultPlanogramColumns.map((col) => (
                                                                <th key={col.dataIndex} className="px-4 py-2 text-left font-semibold" style={{color: textPri||"#1f2937"}}>
                                                                    {col.title}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {
                                                            planogramLoading ?
                                                                <td className="px-4 py-4 animate-pulse" style={{backgroundColor: bgSub||"#f3f4f6"}} colSpan={1}>

                                                                </td>
                                                                :

                                                                !planogramData?.planogramlist || planogramData.planogramlist.length === 0 ? (
                                                                    <tr>
                                                                        <td className="px-4 py-4" style={{color: textSec||"#6b7280"}} colSpan={1}>
                                                                            No data available
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    planogramData?.planogramlist?.map((item, idx) => (
                                                                        <tr key={idx} className="border-b transition-colors" style={{borderColor: border||"#e5e7eb"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor="transparent"}>

                                                                            <td key={col.dataIndex} className="px-4 py-2" style={{color: textSec||"#6b7280"}}>
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

                                <div className="border rounded-lg overflow-hidden" style={{borderColor: border||"#e5e7eb"}}>
                                    <button
                                        onClick={() => togglePanel(5)}
                                        className="w-full flex justify-between items-center px-4 py-3 text-left" style={{backgroundColor: bgSub||"#f9fafb", color: textPri||"#1f2937"}}
                                        onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f3f4f6"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor=bgSub||"#f9fafb"}
                                    >
                                        <span className="font-medium">Show Stores Contains Product</span>
                                        <span className="cursor-pointer">{openPanel === 5 ? "−" : "+"}</span>
                                    </button>

                                    {openPanel === 5 && (
                                        <div className="px-4 py-3" style={{backgroundColor: bg||"#fff"}}>
                                            <div className="overflow-x-auto border rounded-lg" style={{borderColor: border||"#e5e7eb"}}>
                                                <table className="min-w-full text-sm">
                                                    <thead className="border-b" style={{backgroundColor: bgSub||"#f9fafb", borderColor: border||"#e5e7eb"}}>
                                                        <tr>
                                                            {defaultStoreColumns.map((col) => (
                                                                <th key={col.dataIndex} className="px-4 py-2 text-left font-semibold" style={{color: textPri||"#1f2937"}}>
                                                                    {col.title}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {storeLoading ?
                                                            <tr>
                                                                <td className="px-4 py-4 animate-pulse text-center" style={{backgroundColor: bgSub||"#f3f4f6"}} colSpan={defaultStoreColumns.length}>
                                                                    Loading...
                                                                </td>
                                                            </tr>
                                                            :
                                                            !storeData?.storelist || storeData.storelist.length === 0
                                                                ? (
                                                                    <tr>
                                                                        <td className="px-4 py-4" style={{color: textSec||"#6b7280"}} colSpan={1}>
                                                                            No data available
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    storeData?.storelist?.map((item, idx) => (
                                                                        <tr key={idx} className="border-b transition-colors" style={{borderColor: border||"#e5e7eb"}} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor=hover||"#f9fafb"} onMouseLeave={(e)=>e.currentTarget.style.backgroundColor="transparent"}>
                                                                            <td key={col.dataIndex} className="px-4 py-2" style={{color: textSec||"#6b7280"}}>
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
