import React, { useState } from "react";
import Modal from "../modal/Modal";
import Link from "next/link";
import { ArchiveIcon } from "@/data/icons";
import { lambdaPost } from "@/app/lamda/lambdaClient";
import { formatDateTime } from "@/lib/utils";

// Local icon replacements (avoid lucide-react dependency)
function ArrowUpDown({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3v18M8 7l4-4 4 4M16 17l-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowUp({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowDown({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SquareCheck({ className, onClick }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} onClick={onClick}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const toast = { success: (msg) => console.log(msg) };

function SortIcon({ columnKey, sortConfig }) {
  const isActive = sortConfig?.key === columnKey && sortConfig.direction;
  if (!isActive) return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />;
  if (sortConfig.direction === "asc") return <ArrowUp className="w-4 h-4 text-blue-600 cursor-pointer" />;
  return <ArrowDown className="w-4 h-4 text-blue-600 cursor-pointer" />;
}

const ProjectsTable = ({ projectListData, projectListLoading, userListLoading, notificationsLoading,
    selectedRetailer, projectType, sortConfig, onSort, fetchProjectList, retailerListLoading }) => {
    const [archiveModal, setArchiveModal] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [isLoading, setIsLoading] = useState(false)

    const SKELETON_ROWS = 8;
    const SKELETON_COLS = 9;

    const makeArchive = async (projectid) => {
        setIsLoading(true)
        const project = projectType === 'activeProjects' ? 'Archive' : 'Active';
        try {
            const payload = {
                projid: projectid,
                setstatus: project,
            };
            const data = await lambdaPost("/updateprojstatus", payload);
            if (!data || data.error) {
                console.log(data.error);
                return;
            }
            toast.success(`${project} successfull`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            if (fetchProjectList) fetchProjectList(selectedRetailer, projectType)
            closeModal();
        } catch (error) {
            console.log(error);
        }
        finally {
            setIsLoading(false)
        }
    };

    const closeModal = () => {
        if (fetchProjectList) fetchProjectList(selectedRetailer, projectType)
        setArchiveModal(false);
    };

    const getSortTitle = (columnKey) => {
        if (sortConfig?.key !== columnKey) return "Click to sort";
        if (!sortConfig.direction) return "Sorting cancelled";
        return sortConfig.direction === "desc" ? "Descending" : "Ascending";
    };

    return (
        <>
            <div className="flex-1 overflow-auto max-h-[65vh]">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative h-full">
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="bg-gray-50 border-b border-gray-200 shadow sticky top-0 z-[1]">
                                <tr>
                                    <th
                                        title={getSortTitle("createdAt")}
                                        onClick={() => onSort && onSort('createdAt')}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 z-0 bg-gray-50 w-32">
                                        <div className="flex items-center gap-1">
                                            Created
                                            <SortIcon columnKey="createdAt" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort && onSort('projName')}
                                        title={getSortTitle("projName")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-32 bg-gray-50 w-20 border-r border-gray-200">
                                        <div className="flex items-center gap-1">
                                            Project Name
                                            <SortIcon columnKey="projName" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort && onSort('projectTime')}
                                        title={getSortTitle("projectTime")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Time Period
                                            <SortIcon columnKey="projectTime" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort && onSort('setStatus')}
                                        title={getSortTitle("setStatus")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Set Status
                                            <SortIcon columnKey="setStatus" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        Total Planograms
                                    </th>
                                    <th onClick={() => onSort && onSort('prodCount')}
                                        title={getSortTitle("prodCount")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Total Products
                                            <SortIcon columnKey="prodCount" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort && onSort('storeCount')}
                                        title={getSortTitle("storeCount")}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Total Stores
                                            <SortIcon columnKey="storeCount" sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th className="sticky right-0 px-4 py-3 text-sm font-semibold text-gray-900 bg-gray-50 border-l border-gray-200">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 -z-0">
                                {projectListLoading || userListLoading || notificationsLoading || retailerListLoading ? (
                                    Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                        <tr key={i} className="border-b">
                                            {Array.from({ length: SKELETON_COLS }).map((__, ci) => (
                                                <td key={ci} className="px-5 py-4">
                                                    <div
                                                        className="h-4 rounded animate-pulse bg-gray-200"
                                                        style={{
                                                            width: ci === 1 ? "70%" : ci === 6 ? "60px" : "80%",
                                                            borderRadius: ci === 6 ? 9999 : 6,
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : !selectedRetailer ? (
                                    <tr>
                                        <td colSpan={10} className="py-10 text-center text-gray-500">
                                            Please select a retailer
                                        </td>
                                    </tr>
                                ) : projectListData?.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-10 text-center text-gray-500">
                                            No data found
                                        </td>
                                    </tr>
                                ) :
                                    projectListData?.map((item) => (
                                        <tr key={item?.projectid} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-600 sticky left-0 bg-white w-32 hover:bg-gray-50">
                                                {formatDateTime(item?.createdAt) || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-32 bg-white min-w-[200px] max-w-[350px] whitespace-normal break-words border-r shadow-xl border-gray-200 hover:bg-gray-50">
                                                <Link
                                                    href={`/projectplanogram/${item?.projectid}/uploads`}
                                                    className="text-blue-500 hover:text-blue-600"
                                                    title={item?.projName}
                                                >
                                                    <span className="line-clamp-2 break-words">
                                                        {item?.projName}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.projectTime || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {item?.setStatus || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.pogCount || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.prodCount || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item?.storeCount || <span className="text-gray-300 text-sm">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${item?.status === 'In-Progress'
                                                        ? "bg-green-100 text-green-800"
                                                        : 'bg-blue-100 text-blue-800 '
                                                        }`}
                                                >
                                                    {item?.status}
                                                </span>
                                            </td>
                                            <td
                                                title={projectType === 'activeProjects' ? 'Make Archive' : 'Make Active'}
                                                className="sticky right-0 px-4 py-3 text-sm text-gray-600 bg-white border-l border-gray-200 shadow-xl hover:bg-gray-50">
                                                {projectType === 'activeProjects' ?
                                                    <button
                                                        onClick={() => {
                                                            setArchiveModal(true);
                                                            setProjectId(item?.projectid);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        <ArchiveIcon className="cursor-pointer w-6 h-6 text-blue-500 hover:text-blue-700" />
                                                    </button>
                                                    :
                                                    <SquareCheck
                                                        onClick={() => {
                                                            setArchiveModal(true);
                                                            setProjectId(item?.projectid);
                                                        }}
                                                        className="text-blue-500 hover:text-blue-700 w-6 h-6 cursor-pointer"
                                                    />
                                                }
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >

            <Modal isOpen={archiveModal} onClose={closeModal} maxWidth="max-w-sm" maxHeight="">
                <div className="h-full flex flex-col">
                    <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {projectType === 'activeProjects' ? 'Archive' : 'Active'} Project
                        </h2>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center px-4 py-6 text-center">
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to {projectType === 'activeProjects' ? 'Archive' : 'Active'} this project?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={closeModal}
                                className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isLoading}
                                onClick={() => {
                                    makeArchive(projectId);
                                }}
                                className="disabled:opacity-40 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                {isLoading ? 'Loading...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal >
        </>
    );
};

export default ProjectsTable;
