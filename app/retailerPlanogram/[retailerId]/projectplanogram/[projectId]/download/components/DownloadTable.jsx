'use client'
/* eslint-disable */
import { formatDate, formatFileSize } from "./formatters";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader } from "lucide-react";
import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";

const DownloadTable = ({ data, isLoading, sortConfig, onSort, theme }) => {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};
    const [downloadingFile, setDownloadingFile] = useState(null);

    const SortIcon = ({ columnKey }) => {

        const isActive = sortConfig?.key === columnKey && sortConfig.direction;
        if (!isActive) {
            return <ArrowUpDown className="w-4 h-4 cursor-pointer" style={{ color: textSec || "#9ca3af" }} />;
        }
        if (sortConfig.direction === "asc") {
            return <ArrowUp className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />;
        }
        return <ArrowDown className="w-4 h-4 cursor-pointer" style={{ color: accent || "#334155" }} />;
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

            <div className="overflow-auto h-full" style={{ backgroundColor: bg || "#fff" }}>
                <table className="w-full border" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
                    <thead className="border-b" style={{ backgroundColor: bgSub || "#f9fafb", borderColor: border || "#e5e7eb" }}>
                        <tr>
                            <th
                                onClick={() => onSort('filename')}
                                 title={getSortTitle("filename")}
                                className="px-4 py-3 text-left sticky left-0"
                                style={{ backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}
                            >
                                <div className="flex items-center gap-1">
                                    File Name
                                    <SortIcon columnKey="filename" />
                                </div>
                            </th>
                            <th
                                onClick={() => onSort('lastmodified')}
                                title={getSortTitle("lastmodified")}
                                className="px-4 py-3 text-left"
                                style={{ color: textPri || "#1f2937" }}>

                                Updated At
                                <SortIcon columnKey="lastmodified" />
                            </th>
                            <th className="px-4 py-3 text-left" style={{ color: textPri || "#1f2937" }}>Size</th>
                            <th className="px-4 py-3 text-left" style={{ color: textPri || "#1f2937" }}>Status</th>
                            <th className="px-4 py-3 text-left" style={{ color: textPri || "#1f2937" }}>Download</th>
                        </tr>
                    </thead>
                    <tbody style={{ backgroundColor: bg || "#fff" }}>
                        {
                            isLoading ? (
                                <tr>
                                    <td colSpan="50" className="h-[250px] text-center" style={{ color: textSec || "#6b7280" }}>
                                        <LoadingSpinner text="Loading..." />
                                    </td>
                                </tr>
                            ) : data?.length === 0 ? (
                                <tr>
                                    <td colSpan="50" className="text-center py-10" style={{ color: textSec || "#6b7280" }}>
                                        No data found
                                    </td>
                                </tr>
                            ) :
                                data.map((item, i) => {
                                    const filename = item.filename.split("/").pop();
                                    const fileUrl = item.link;

                                    return (
                                        <tr key={i} className="transition-colors" style={{ borderColor: border || "#e5e7eb" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover || "#f9fafb"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                                            <td className="px-4 py-3 sticky left-0" style={{ backgroundColor: bg || "#fff", color: textPri || "#1f2937" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover || "#f9fafb"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bg || "#fff"}>{filename}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: textSec || "#6b7280" }}>{formatDate(item.lastmodified)}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: textSec || "#6b7280" }}>{formatFileSize(item.size)}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: textSec || "#6b7280" }}>{item.status ?? "N/A"}</td>

                                            <td
                                                className={`px-4 py-3 text-sm flex gap-2 items-center ${fileUrl ? "cursor-pointer hover:underline" : ""}`}
                                                style={{ color: fileUrl ? (accent || "#2563eb") : (textSec || "#d1d5db") }}
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
