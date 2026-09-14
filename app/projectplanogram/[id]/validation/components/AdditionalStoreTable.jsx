import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const AdditionalStoreTable = ({ data, sortConfig, onSort }) => {


    const SortIcon = ({ columnKey }) => {
        if (sortConfig?.key !== columnKey) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 text-blue-600 cursor-pointer" />
            : <ArrowDown className="w-4 h-4 text-blue-600 cursor-pointer" />;
    };

    return (
        <>

            <div className="flex-1 overflow-auto h-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative h-full">
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="bg-gray-50 border-b border-gray-200 shadow sticky top-0 z-[1]">
                                <tr>
                                    <th
                                        onClick={() => onSort('extrastore')}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 z-0 bg-gray-50 w-32">
                                        <div className="flex items-center gap-1">
                                            Extra Store	
                                            <SortIcon columnKey="extrastore" />
                                        </div>
                                    </th>
                                    <th onClick={() => onSort('chchainname')}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-32 bg-gray-50 w-48 border-r border-gray-200">
                                        <div className="flex items-center gap-1">
                                            Chain Name
                                            <SortIcon columnKey="chchainname" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        Account group Id
                                    </th>
                                    <th onClick={() => onSort('ibasecallpointid')}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            Account group Name
                                            <SortIcon columnKey="ibasecallpointid" />
                                        </div>
                                    </th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 -z-0">
                                {
                                    data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="50" className="text-center py-10 text-gray-500">
                                                No data found
                                            </td>
                                        </tr>
                                    ) :
                                        data?.map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600 sticky left-0 bg-white w-32 hover:bg-gray-50">
                                                    {item?.extrastore || <span className="text-gray-300 text-sm">N/A</span>}
                                                </td>

                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-32 bg-white w-48 border-r shadow-xl border-gray-200 whitespace-normal break-words hover:bg-gray-50">
                                                    {item?.chchainname || <span className="text-gray-300 text-sm">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {item?.ibasecallpointid || <span className="text-gray-300 text-sm">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 w-48">
                                                    {item?.chBaseCallPointName || <span className="text-gray-300 text-sm">N/A</span>}
                                                </td>


                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdditionalStoreTable;
