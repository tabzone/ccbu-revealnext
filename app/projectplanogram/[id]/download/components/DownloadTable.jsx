'use client'
/* eslint-disable */
import { formatDate, formatFileSize } from "./formatters";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader } from "lucide-react";
import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";

const DownloadTable = ({ data, isLoading, sortConfig, onSort }) => {
    const [downloadingFile, setDownloadingFile] = useState(null);

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

    const handleDownload = async (fileUrl, filename) => {
        try {
            setDownloadingFile(filename);
            toast.info("Download starting...", { autoClose: 1000 });

            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => {
                toast.success("Download completed ✅", { autoClose: 1000 });
                setDownloadingFile(null);
            }, 1200);

        } catch (error) {
            setDownloadingFile(null);
            toast.error("Download failed");
            console.error(error);
        }
    };

    return (
        <>

            <div className="overflow-auto h-full bg-white">
                <table className="w-full border border-gray-200 bg-white">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th
                                onClick={() => onSort('filename')}
                                 title={getSortTitle("filename")}
                                className="px-4 py-3 text-left sticky left-0 bg-gray-50"
                            >
                                <div className="flex items-center gap-1">
                                    File Name
                                    <SortIcon columnKey="filename" />
                                </div>
                            </th>
                            <th
                                onClick={() => onSort('lastmodified')}
                                title={getSortTitle("lastmodified")}
                                className="px-4 py-3 text-left">

                                Updated At
                                <SortIcon columnKey="lastmodified" />
                            </th>
                            <th className="px-4 py-3 text-left">Size</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Download</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {
                            isLoading ? (
                                <tr>
                                    <td colSpan="50" className="h-[250px] text-center">
                                        <LoadingSpinner text="Loading..." />
                                    </td>
                                </tr>
                            ) : data?.length === 0 ? (
                                <tr>
                                    <td colSpan="50" className="text-center py-10">
                                        No data found
                                    </td>
                                </tr>
                            ) :
                                data.map((item, i) => {
                                    const filename = item.filename.split("/").pop();
                                    const fileUrl = item.link;

                                    return (
                                        <tr key={i} className="bg-white hover:bg-gray-100 transition">
                                            <td className="px-4 py-3 sticky left-0 bg-white">{filename}</td>
                                            <td className="px-4 py-3 text-sm">{formatDate(item.lastmodified)}</td>
                                            <td className="px-4 py-3 text-sm">{formatFileSize(item.size)}</td>
                                            <td className="px-4 py-3 text-sm">{item.status ?? "N/A"}</td>

                                            <td
                                                className={`px-4 py-3 text-sm flex gap-2 items-center ${fileUrl ? "cursor-pointer text-blue-600 hover:underline" : "text-gray-300"
                                                    }`}
                                                onClick={() =>
                                                    fileUrl &&
                                                    downloadingFile !== filename &&
                                                    handleDownload(fileUrl, filename)
                                                }
                                            >
                                                {downloadingFile === filename ? (
                                                    <Loader className="animate-spin w-4 h-4" />
                                                ) : (
                                                    fileUrl ? "Download" : "N/A"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                    </tbody>
                </table>
            </div>

        </>
    );
};

export default DownloadTable;
