"use client";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React, { useState } from "react";
import { lambdaPost } from "@/app/lamda/lambdaClient";
import { toast } from "react-toastify";

const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <div className="border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin w-8 h-8"></div>
    {text && <p className="mt-3 text-gray-600 text-sm font-medium">{text}</p>}
  </div>
);

const ProjectStoresTable = ({ data, isLoading, sortConfig, onSort }) => {
    const [qrLoading, setQrLoading] = useState(null);
    const [qrStatus, setQrStatus] = useState({});

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

    const buildAddress = (item) => {
        const parts = [
            item?.storeaddress1,
            item?.storeaddress2,
            item?.storecity,
            item?.state,
            item?.storezip,
        ].filter(Boolean).map(s => String(s).trim()).filter(Boolean);
        if (parts.length) return parts.join(", ");
        return item?.address || item?.storeaddress1 || "";
    };

    const triggerSameTabDownload = (url, filename) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "qr.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const handleGenerateQr = async (item, idx) => {
        const key = item?.storenumber ? String(item.storenumber) + "_" + idx : String(idx);
        const storenumber = item?.storenumber ? String(item.storenumber) : "";
        const address = buildAddress(item);
        setQrLoading(key);
        setQrStatus((prev) => ({ ...prev, [key]: "Downloading…" }));
        toast.info("Downloading…", { position: "top-right", autoClose: 1200, hideProgressBar: true });
        try {
            const payload = { storenumber, address };
            const result = await lambdaPost("/getqrcode", payload);
            if (result instanceof Blob) {
                const ct = result.type || "application/pdf";
                const ext = ct.includes("png") ? "png" : ct.includes("pdf") ? "pdf" : "pdf";
                const filename = `QR-${storenumber || "store"}.${ext}`;
                const blobUrl = URL.createObjectURL(result);
                triggerSameTabDownload(blobUrl, filename);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
                return;
            }
            const data = result;
            const root = data?.data ? data.data : data;
            const downloadUrl = root?.downloadUrl || root?.downloadURL || root?.url || root?.qrUrl || root?.qrcodeUrl || root?.link || root?.fileUrl || root?.s3Url || data?.downloadUrl || data?.url || null;
            let base64 = root?.qrcode || root?.qrCode || root?.qr || root?.image || root?.base64 || root?.qrcodeBase64 || root?.qrCodeBase64 || data?.qrcode || data?.qrCode || null;
            if (typeof root === "string") {
                if (root.startsWith("http")) {
                    triggerSameTabDownload(root, `QR-${storenumber || "store"}.png`);
                    setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                    toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
                    return;
                }
                if (root.startsWith("data:image") || root.length > 100) base64 = root;
            }
            if (typeof data === "string" && data.startsWith("http")) {
                triggerSameTabDownload(data, `QR-${storenumber || "store"}.png`);
                setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
                return;
            }
            const filename = `QR-${storenumber || "store"}.png`;
            if (downloadUrl) {
                triggerSameTabDownload(downloadUrl, filename);
                setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
            } else if (base64) {
                let url = String(base64).trim();
                if (!url.startsWith("data:")) url = `data:image/png;base64,${url}`;
                try {
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    triggerSameTabDownload(blobUrl, filename);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                } catch {
                    triggerSameTabDownload(url, filename);
                }
                setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
            } else if (root?.body) {
                let body = root.body;
                if (typeof body === "string") { try { body = JSON.parse(body); } catch { } }
                const bodyUrl = body?.downloadUrl || body?.url || body?.qrcodeUrl;
                const bodyB64 = body?.qrcode || body?.qrCode || body?.base64;
                if (bodyUrl) {
                    triggerSameTabDownload(bodyUrl, filename);
                    setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                    toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
                } else if (bodyB64) {
                    let url = String(bodyB64).trim();
                    if (!url.startsWith("data:")) url = `data:image/png;base64,${url}`;
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    triggerSameTabDownload(blobUrl, filename);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                    setQrStatus((prev) => ({ ...prev, [key]: "Download started" }));
                    toast.success("Download started", { position: "top-right", autoClose: 1500, hideProgressBar: true });
                } else throw new Error("QR response missing url/base64");
            } else {
                console.warn("getqrcode response unrecognized:", data);
                throw new Error("QR response missing download data");
            }
        } catch (err) {
            console.error("QR generation failed:", err);
            toast.error(err?.message || "Failed to generate QR", { position: "top-right", autoClose: 2000 });
            setQrStatus((prev) => ({ ...prev, [key]: "Failed" }));
            setTimeout(() => setQrStatus((prev) => { const n = { ...prev }; delete n[key]; return n; }), 2000);
        } finally {
            setQrLoading(null);
            setTimeout(() => setQrStatus((prev) => {
                if (prev[key] === "Download started" || prev[key] === "Failed") {
                    const n = { ...prev }; delete n[key]; return n;
                }
                return prev;
            }), 2500);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-auto h-full">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative h-full">
                    <div className="overflow-auto h-full">
                        <table className="w-full border-separate border-spacing-0 min-w-max">
                            <thead className="sticky top-0 z-50 bg-gray-50 border-b border-gray-200">
                                <tr className="z-20">
                                    <th onClick={() => onSort("storenumber")} title={getSortTitle("storenumber")} className="px-4 py-3 text-sm font-semibold text-gray-900 sticky left-0 z-50 bg-gray-50 w-32 min-w-32 max-w-32 border-r border-gray-200">
                                        <div className="flex items-center gap-1">Store Numbers<SortIcon columnKey="storenumber" /></div>
                                    </th>
                                    <th onClick={() => onSort("pogcount")} title={getSortTitle("pogcount")} className="px-4 py-3 text-sm font-semibold text-gray-900 sticky left-32 z-50 bg-gray-50 w-32 min-w-32 max-w-32 border-r border-gray-200">
                                        <div className="flex items-center gap-1">Pog Count<SortIcon columnKey="pogcount" /></div>
                                    </th>
                                    <th onClick={() => onSort('region')} title={getSortTitle("region")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Region<SortIcon columnKey="region" /></div></th>
                                    <th onClick={() => onSort('division')} title={getSortTitle("division")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Division<SortIcon columnKey="division" /></div></th>
                                    <th onClick={() => onSort('salesoffice')} title={getSortTitle("salesoffice")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Sales Office<SortIcon columnKey="salesoffice" /></div></th>
                                    <th onClick={() => onSort('storeaddress1')} title={getSortTitle("storeaddress1")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Store Address 1<SortIcon columnKey="storeaddress1" /></div></th>
                                    <th onClick={() => onSort('storeaddress2')} title={getSortTitle("storeaddress2")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Store Address 2<SortIcon columnKey="storeaddress2" /></div></th>
                                    <th onClick={() => onSort('storecity')} title={getSortTitle("storecity")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Store City<SortIcon columnKey="storecity" /></div></th>
                                    <th onClick={() => onSort('state')} title={getSortTitle("state")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Store State<SortIcon columnKey="state" /></div></th>
                                    <th onClick={() => onSort('storezip')} title={getSortTitle("storezip")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Store Zip<SortIcon columnKey="storezip" /></div></th>
                                    <th onClick={() => onSort('desc1')} title={getSortTitle("desc1")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Desc 1<SortIcon columnKey="desc1" /></div></th>
                                    <th onClick={() => onSort('desc2')} title={getSortTitle("desc2")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Desc 2<SortIcon columnKey="desc2" /></div></th>
                                    <th onClick={() => onSort('desc3')} title={getSortTitle("desc3")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Desc 3<SortIcon columnKey="desc3" /></div></th>
                                    <th onClick={() => onSort('desc4')} title={getSortTitle("desc4")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Desc 4<SortIcon columnKey="desc4" /></div></th>
                                    <th onClick={() => onSort('desc5')} title={getSortTitle("desc5")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Desc 5<SortIcon columnKey="desc5" /></div></th>
                                    <th onClick={() => onSort('value1')} title={getSortTitle("value1")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Value 1<SortIcon columnKey="value1" /></div></th>
                                    <th onClick={() => onSort('value2')} title={getSortTitle("value2")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Value 2<SortIcon columnKey="value2" /></div></th>
                                    <th onClick={() => onSort('value3')} title={getSortTitle("value3")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Value 3<SortIcon columnKey="value3" /></div></th>
                                    <th onClick={() => onSort('value4')} title={getSortTitle("value4")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Value 4<SortIcon columnKey="value4" /></div></th>
                                    <th onClick={() => onSort('value5')} title={getSortTitle("value5")} className="px-4 py-3 text-left text-sm font-semibold text-gray-900"><div className="flex items-center gap-1">Value 5<SortIcon columnKey="value5" /></div></th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky right-0 z-40 bg-gray-50 border-l border-gray-200 w-36 min-w-36">QR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr><td colSpan={21} className="py-10 text-center"><LoadingSpinner text="Loading..." /></td></tr>
                                ) : data?.length === 0 ? (
                                    <tr><td colSpan={21} className="py-10 text-center text-gray-500">No data found</td></tr>
                                ) : data?.map((item, i) => {
                                        const qrKey = item?.storenumber ? String(item.storenumber) + "_" + i : String(i);
                                        const isQrLoading = qrLoading === qrKey;
                                        const statusText = qrStatus[qrKey];
                                        const hasStoreNumber = String(item?.storenumber ?? "").trim() !== "";
                                        const address = buildAddress(item).trim();
                                        const isMissingRequired = !hasStoreNumber || !address;
                                        const isDisabled = isQrLoading || isMissingRequired;
                                        return (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600 sticky left-0 z-40 bg-white w-32 min-w-32 max-w-32 border-r border-gray-200">{item?.storenumber || <span className="text-gray-300 text-sm">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 sticky left-32 z-40 bg-white w-32 min-w-32 max-w-32 border-r border-gray-200">{item?.pogcount || <span className="text-gray-300 text-sm">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.region || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.division || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.salesoffice || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.storeaddress1 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.storeaddress2 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.storecity || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.state || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.storezip || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.desc1 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.desc2 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.desc3 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.desc4 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.desc5 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.value1 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.value2 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.value3 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.value4 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item?.value5 || <span className="text-gray-300">N/A</span>}</td>
                                                <td className="px-4 py-3 text-sm sticky right-0 z-40 bg-white border-l border-gray-200">
                                                    <button onClick={() => handleGenerateQr(item, i)} disabled={isDisabled} title={isMissingRequired ? "Store number and address required" : "Generate QR"} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${isDisabled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"}`}>
                                                        {isQrLoading ? <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span> : null}
                                                        {statusText || "Generate QR"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectStoresTable;
