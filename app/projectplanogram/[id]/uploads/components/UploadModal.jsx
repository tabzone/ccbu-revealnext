"use client";
import { useEffect, useState } from "react";
import UppyDashboard from "./UppyDashboard";
import Uppy from "@uppy/core";
import { useParams } from "next/navigation";
import UploadOnlyModal from "./UploadOnlyModal";
import { toast } from "react-toastify";
import DataZip from "./DataZip";
import { lambdaGet } from "@/app/lamda/lambdaClient";

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET

const UploadModal = ({
    open,
    setOpen,
    updateRequest,
    createProjRequest,
    fetchProjectReqList,
    typeToUpload,
    createReqData,
    fileType = 'PSA',
    theme
}) => {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};
    const [files, setFiles] = useState([]);
    const [rawFiles, setRawFiles] = useState([]);
    const [step, setStep] = useState(1);
    const [uppy, setUppy] = useState(null);
    const [filecount, setFilecount] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [name, setName] = useState('');
    const [uploadFileCount, setUploadFileCount] = useState(0);
    const [isAdded, setIsAdded] = useState(false);
    const [process, setProcess] = useState(false);
    const [fileCountLoading, setFileCountLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false)
    const [dataReq, setdataReq] = useState({
        status: 'processing',
        filecount: 0,
        fileprocessing: 0,
        filecompleted: 0,
        fileerrored: 0,
    });
    const uploadType = fileType;
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPolling, setIsPolling] = useState(false);
    const [folderList, setFolderList] = useState([]);
    const [uploadError, setUploadError] = useState(null);
    const [validationComplete, setValidationComplete] = useState(false);
    const [supportedPsa, setSupportedPsa] = useState(null)

    const { id } = useParams();

    useEffect(() => {
        if (!typeToUpload) return;

        const uppyInstance = new Uppy({
            autoProceed: false,
            restrictions: {
                minNumberOfFiles: 1,
                allowedFileTypes: uploadType === 'PDF'
                    ? ['.pdf', 'application/pdf', '.PDF']
                    : [".psa", "application/psa", ".PSA"],
            },
            onBeforeFileAdded: (currentFile, files) => {
                const incomingName = currentFile.name.toLowerCase();

                const duplicateExists = Object.values(files).some(
                    (file) => file.name.toLowerCase() === incomingName
                );

                if (duplicateExists) {
                    uppyInstance.info(
                        `File "${currentFile.name}" already exists`,
                        "error",
                        3000
                    );
                    return false;
                }

                return true;
            }

        });



        if (typeToUpload === "folders") {
            uppyInstance.on("files-added", (addedFiles) => {

                // all raw files for zipping
                setRawFiles(addedFiles);

                // unique folder names from relative paths
                const folders = new Set();
                addedFiles.forEach((file) => {
                    const folderPath = file.meta?.relativePath?.split("/")?.[0];
                    if (folderPath) folders.add(folderPath);
                });
                const folderEntries = Array.from(folders).map((folderName) => ({
                    id: folderName,
                    name: folderName,
                    type: "folder",
                    isFolder: true,
                }));

                setFiles(folderEntries);
                setFilecount(folderEntries.length);
                setIsAdded(true);

            });
        } else {
            //file upload
            uppyInstance
                .on("file-added", (file) => {
                    setFiles((prev) => [...prev, file.data]);
                    setRawFiles((prev) => [...prev, file]);
                    setFilecount((prev) => prev + 1);
                    setIsAdded(true);
                })
                .on("file-removed", () => {
                    setFiles([]);
                    setRawFiles([]);
                    setFilecount(0);
                    setIsAdded(false);
                });
        }

        setUppy(uppyInstance);
        return () => uppyInstance.destroy();
    }, [typeToUpload, uploadType]);


    const getUploadedFilecount = async (bucket, projectid, requestid) => {
        try {
            const data = await lambdaGet(`/getuploadedfilecount/${bucket}/${projectid}/${requestid}`);
            if (!data || data.error) {
                console.log(data.error);
                return;
            }

            return data;
        } catch (err) {
            console.error("Error getting file count:", err);
            throw err;
        }
    };

    const getMultiFolderList = async (projectid, requestid) => {
        try {
            setFileCountLoading(true);
            const data = await lambdaGet(`/getmultifolderlist/${projectid}/${requestid}`);
            if (!data || data.error) {
                console.log(data.error);
                return;
            }
            return data;
        } catch (err) {
            console.error("Error getting folder list:", err);
            throw err;
        } finally {
            setFileCountLoading(false);
        }
    };


    const getProgressFileCount = async (pid, rid, len) => {
        const expectedCount = typeToUpload === 'folders' ? (rawFiles.length || len) : (filecount || len);
        const pollInterval = 2500;
        const timeout = 90000;
        const start = Date.now();

        setFileCountLoading(true);
        setUploadError(null);
        setValidationComplete(false);

        const poll = async () => {
            try {
                const res = await getUploadedFilecount(BUCKET_NAME, pid, rid);
                let uploadedCount = 0;
                if (res == null) {
                    uploadedCount = 0;
                } else if (typeof res === "object") {
                    uploadedCount = Number(res?.data?.count ?? res?.count ?? 0) || 0;
                } else {
                    uploadedCount = Number(res) || 0;
                }

                setUploadFileCount(uploadedCount);
                if (uploadedCount === expectedCount) {
                    setValidationComplete(true);
                    setFileCountLoading(false);
                    if (typeToUpload === "folders") {
                        try {
                            const folderData = await getMultiFolderList(pid, rid);
                            setFolderList(folderData?.data || []);
                        } catch (err) {
                            console.warn('Failed to get folder list (non-blocking):', err);
                        }
                    }
                    setStep(2);
                    return;
                }

                if (Date.now() - start < timeout) {
                    setTimeout(poll, pollInterval);
                } else {
                    console.warn("Validation timed out");
                    setFileCountLoading(false);
                    setUploadError({
                        type: "timeout",
                        message: `Validation timed out. Expected ${expectedCount} files, but found ${uploadedCount}.`,
                    });
                    setStep(3);
                }
            } catch (error) {
                console.error(" Error checking file count:", error);
                setFileCountLoading(false);
                setUploadError({
                    type: "api",
                    message: `Error validating upload: ${error?.message || error}`,
                });
                setStep(3);
            }
        };

        poll();
    };


    const compressedUpload = async (pid, rid) => {
        try {
            setIsUploading(true);
            setUploadError(null);
            setUploadProgress(0);

            let filesToZip;

            if (typeToUpload === 'folders') {
                filesToZip = rawFiles.map(file => ({
                    data: file.data,
                    name: file.meta?.relativePath || file.name,
                }));
            } else {
                filesToZip = files.map(f => f.data ?? f);

            }
            const zipBlob = await DataZip(filesToZip, uploadType);
           

            const filePathUrl = await getFilepath(BUCKET_NAME, pid, rid, 'file.zip')
            const actualFiles = rawFiles.filter(f => !f.isFolder && !f.meta?.isFolder);
            const expectedCount = actualFiles.length;
 
            const uploadRes = await fetch(filePathUrl?.uploadUrl, {
                method: "PUT",
                body: zipBlob,
                headers: {
                    "Content-Type": zipBlob.type || "application/zip",
                },
            });
            if (!uploadRes.ok) throw new Error("Upload failed");

            await getProgressFileCount(pid, rid, rawFiles.length);

        } catch (err) {
            console.error("Upload failed:", err);
            setUploadError({
                type: "upload",
                message: "Upload failed: " + err.message,
            });
            setStep(3);
        } finally {
            setIsUploading(false);
        }
    };

    const createProj = () => {
        const projName = `Project-${new Date().toLocaleDateString()}`;
        setName(projName);
        compressedUpload(id, createReqData?.requestid);
    };

    const closeModal = () => {
        setIsPolling(false);
        if (uppy) {
            uppy.cancelAll();
        }
        const isSafeToCancel = !submitLoading && !process && step < 3;
        if (isSafeToCancel) {
            updateRequest(id, createReqData?.requestid, "cancel", 0, uploadType === 'PSA' ? 'PMF' : uploadType, files[0]?.name, "", []);
        }
        setOpen(false);
        setStep(1);
        setFiles([]);
        setRawFiles([]);
        setFilecount(0);
        setIsAdded(false);
        setUploadProgress(0);
        setUploadError(null);
        setFolderList([]);
        fetchProjectReqList()
    };



    const getRequest = async () => {
        try {
            const data = await lambdaGet(`/getrequest/${id}/${createReqData?.requestid}/${uploadType}`);
            if (!data || data.error) {
                console.log(data.error);
                return;
            }
            return data;
        } catch (err) {
            console.error("Error getting request:", err);
            throw err;
        }
    };

    const fetchUnsupportedPsa = async () => {
        try {
            const data = await lambdaGet(`/getunsupportedpsa/${id}/${createReqData?.requestid}`);

            if (!data || data.error) {
                console.log(data.error);
                return;
            }
            return data;
        } catch (err) {
            console.error("Error getting request:", err);
            throw err;
        }
    };

    const getFilepath = async (bucket, projectid, requestid, filename) => {
        try {
            setFileCountLoading(true);
            const key = filename;
            const data = await lambdaGet(`/uploadurl/${bucket}/${projectid}/${requestid}/${key}`)
            if (!data || data.error) {
                console.log(data.error);
                return;
            }
            return data;
        } catch (err) {
            console.error("Error getting file count:", err);
            throw err;
        } finally {
            setFileCountLoading(false);
        }
    };


    const handleSubmit = async () => {
        try {
            setSubmitLoading(true)
            const count = typeToUpload === 'folders' ? rawFiles.length : filecount;
            updateRequest(id, createReqData?.requestid, 'processing', count, uploadType, files[0]?.name, '', []);
            setStep(3);
            setProcess(true);
            setIsPolling(true);

            setTimeout(async () => {
                try {
                    const data = await getRequest();
                    setdataReq(data);
                    setProcess(false);
                } catch (err) {
                    console.error('Error getting request status:', err);
                    setProcess(false);
                }
            }, 5000);
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            alert('Failed to submit: ' + err.message);
        }
        finally {
            setSubmitLoading(false)
        }
    };

    useEffect(() => {
        if (!isPolling || !createReqData?.requestid) return;

        const fetchData = async () => {
            try {
                const data = await getRequest();
                setdataReq(data);

                if (uploadType === 'PSA' && data.status === "error in psa") {
                    const data = await fetchUnsupportedPsa();
                    setSupportedPsa(data)
                    setIsPolling(false);
                    return;
                }

                if (data.status === "complete") {
                    setIsPolling(false);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        const interval = setInterval(fetchData, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [isPolling, id, createReqData?.requestid, uploadType]);

    const handleOk = () => {
        setIsPolling(false);
        setOpen(false);
        setStep(1);
        setdataReq({
            status: '',
            filecount: 0,
            fileprocessing: 0,
            filecompleted: 0,
            fileerrored: 0,
        });
        setFiles([]);
        setRawFiles([]);
        setUploadProgress(0);
        setIsUploading(false);
        setFilecount(0);
        setFolderList([]);

        if (uppy) {
            uppy.cancelAll();
        }
        fetchProjectReqList()
    };

    const handleCancel = () => {
        if (uppy) {
            uppy.cancelAll();
        }

        updateRequest(id, createReqData?.requestid, "cancel", 0, uploadType === 'PSA' ? 'PMF' : uploadType, "", "", []);

        setOpen(false);
        setStep(1);
        setFiles([]);
        setRawFiles([]);
        setFilecount(0);
        setIsAdded(false);
    };

    const downloadSupportedPsa = () => {
        if (!supportedPsa?.downloadUrl) {
            toast.error("Download URL not available");
            return;
        }

        toast.info("Starting download...", {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true,
        });

        const a = document.createElement("a");
        a.href = supportedPsa.downloadUrl;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success("Download started!", {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true,
        });
    };


    return (
        <UploadOnlyModal
            isOpen={open}
            onClose={handleCancel}
            maxWidth="max-w-4xl"
            maxHeight="h-[500px]"
        >
            <div className="h-full flex flex-col -m-6">
                <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: border || "#e5e7eb" }}>
                    <h2 className="text-lg font-semibold" style={{ color: textPri || "#111827" }}>
                        Upload {uploadType === 'PDF' ? 'PDF' : 'Schematic'} {typeToUpload === 'folders' ? 'Folders' : 'Files'}
                    </h2>
                </div>

                <div className="flex items-center gap-6 px-6 py-4 border-b flex-shrink-0" style={{ borderColor: border || "#e5e7eb" }}>
                    {["Upload", "Review & Submit", "Upload Status"].map((label, index) => {
                        const count = index + 1;
                        return (
                            <div
                                key={count}
                                className={`${step === count && "border-b-2 border-blue-500"} flex justify-center items-center gap-2 w-full py-2`}
                            >
                                <div
                                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${step === count
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : step > count
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : ""
                                        }`}
                                    style={step > count || step === count ? {} : { backgroundColor: bgSub || "#f3f4f6", color: textSec || "#4b5563", borderColor: border || "#d1d5db" }}
                                >
                                    {step > count ? "✓" : count}
                                </div>
                                <span className={`text-sm font-medium ${step === count ? "text-blue-600" : ""}`} style={step === count ? {} : { color: textSec || "#6b7280" }}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex-1 px-6 py-4 overflow-auto min-h-[300px]">
                    {uploadError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {uploadError.message || "Something went wrong"}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="w-full h-full flex justify-center items-center">
                            {uppy && createReqData?.requestid ? (
                                <UppyDashboard uppy={uppy} uploadType={typeToUpload} />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin h-8 w-8 border-4 border-t-blue-600 rounded-full" style={{ borderColor: `${border || "#d1d5db"}`, borderTopColor: "#2563eb" }} />
                                    <p style={{ color: textSec || "#6b7280" }}>Preparing for upload...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <>
                            {(isUploading || fileCountLoading || !validationComplete) ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div
                                        className="border-4 border-t-blue-600 rounded-full animate-spin"
                                        style={{ width: 44, height: 44, borderColor: border || "#d1d5db", borderTopColor: "#2563eb" }}
                                    />
                                    <p className="mt-4 text-lg font-medium" style={{ color: textSec || "#4b5563" }}>
                                        {isUploading && uploadProgress !== 100
                                            ? `Uploading... ${uploadProgress}%`
                                            : `Processing ${uploadFileCount}/${typeToUpload === 'folders' ? rawFiles.length : filecount}`}
                                    </p>

                                    <p className="mt-2 text-sm" style={{ color: textSec || "#6b7280" }}>
                                        {validationComplete ? 'Validation complete — preparing UI...' : 'Waiting for files to appear...'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {isAdded && (
                                        <div className="flex justify-center mb-4">
                                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-center max-w-xl w-full">
                                                {typeToUpload === 'folders'
                                                    ? `${filecount} folder${filecount > 1 ? 's' : ''} (${rawFiles.length} files)`
                                                    : `${filecount} file${filecount > 1 ? 's' : ''}`
                                                } selected — Click <span className="font-semibold">Submit</span> to continue.
                                            </div>
                                        </div>
                                    )}

                                    <div className="rounded-lg shadow-inner max-h-72 overflow-auto p-4" style={{ backgroundColor: bg || "#fff" }}>
                                        {files && files.length > 0 ? (
                                            <table className="min-w-full text-sm text-left border-collapse" style={{ color: textPri || "#374151" }}>
                                                <thead>
                                                    <tr className="border-b uppercase text-xs" style={{ backgroundColor: bgSub || "#f9fafb", color: textSec || "#4b5563" }}>
                                                        <th className="py-2 px-3 font-medium">
                                                            {typeToUpload === 'folders' ? 'Folder Name' : 'File Name'}
                                                        </th>
                                                        <th className="py-2 px-3 font-medium">
                                                            {typeToUpload === 'folders' ? 'Files' : 'Size'}
                                                        </th>
                                                        <th className="py-2 px-3 font-medium">Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {typeToUpload === 'folders'
                                                        ? (Array.isArray(folderList?.data) ? folderList.data : folderList || []).map((folderName, index) => (
                                                            <tr key={index} className="border-b last:border-0 transition-colors" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover || "#f9fafb")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                                                <td className="py-2 px-3 font-medium" style={{ color: textPri || "#1f2937" }}>
                                                                    {folderName}
                                                                </td>
                                                            </tr>
                                                        ))
                                                        : files.map((file, index) => (
                                                            <tr key={index} className="border-b last:border-0 transition-colors" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover || "#f9fafb")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                                                                <td className="py-2 px-3 font-medium" style={{ color: textPri || "#1f2937" }}>
                                                                    {file.name || "—"}
                                                                </td>
                                                                <td className="py-2 px-3" style={{ color: textSec || "#4b5563" }}>
                                                                    {(file.size / 1024).toFixed(1)} KB
                                                                </td>
                                                                <td className="py-2 px-3" style={{ color: textSec || "#4b5563" }}>
                                                                    {uploadType || "unknown"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="text-sm text-center py-8" style={{ color: textSec || "#6b7280" }}>
                                                No {typeToUpload === 'folders' ? 'folders' : 'files'} selected yet.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {step === 3 && (
                        <>
                            {uploadError ? (
                                <div className="flex flex-col items-center justify-center p-6">
                                    <svg
                                        className="w-16 h-16 text-red-600 mb-3"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <h4 className="text-red-600 font-medium text-lg mb-1">
                                        Upload Failed
                                    </h4>
                                    <p className="text-sm text-center max-w-sm" style={{ color: textPri || "#374151" }}>
                                        {uploadError.message}
                                    </p>
                                    <button
                                        onClick={handleOk}
                                        className="mt-4 px-5 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : process ? (
                                <div className="flex flex-col items-center justify-center p-6">
                                    <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin" style={{ borderColor: border || "#d1d5db", borderTopColor: "#2563eb" }} />
                                    <p className="mt-3" style={{ color: textSec || "#4b5563" }}>Processing...</p>
                                </div>
                            ) : dataReq.status === "error in psa" ? (
                                <div className="flex flex-col items-center justify-center p-6 gap-4">

                                    <h4 className="text-orange-500 font-medium text-2xl">{dataReq.status}</h4>
                                    {supportedPsa?.downloadUrl && (
                                        <button
                                            onClick={downloadSupportedPsa}
                                            className="px-4 py-2 rounded mt-2 bg-blue-600 text-white cursor-pointer text-sm"
                                        >
                                            Download
                                        </button>
                                    )}
                                </div>
                            ) :
                                dataReq.status === "complete" ? (
                                    <div className="flex flex-col items-center justify-center p-6">
                                        <svg
                                            className="w-16 h-16 text-green-600 mb-2"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <h4 className="text-green-600 font-medium text-lg">Process Completed</h4>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6">
                                        <div className="w-11 h-11 border-4 border-t-orange-500 rounded-full animate-spin mb-2" style={{ borderColor: border || "#d1d5db", borderTopColor: "#f97316" }} />
                                        <p className="text-orange-500 font-medium text-lg">
                                            {dataReq.filecount === 1
                                                ? `${dataReq.status} 1 file`
                                                : `${dataReq.status} ${dataReq.filecount || ""} files`}
                                        </p>
                                    </div>
                                )}
                        </>
                    )}

                </div>

                <div className="px-6 py-4 border-t flex items-center justify-end gap-2 flex-shrink-0" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
                    {step === 1 && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm rounded cursor-pointer border transition-colors"
                            style={{ borderColor: border || "#d1d5db", color: textPri || "#374151" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover || "#f9fafb")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                            Cancel
                        </button>
                    )}

                    {step === 1 ? (
                        <button
                            disabled={files.length === 0 || !createReqData?.requestid}
                            onClick={() => {
                                setStep(2);
                                createProj();
                                setIsAdded(false);
                            }}
                            className="px-4 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            Upload
                        </button>
                    ) : step === 2 ? (
                        <button
                            disabled={fileCountLoading || isUploading || submitLoading}
                            onClick={handleSubmit}
                            className="px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed
                            cursor-pointer text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            {fileCountLoading ? "Processing..." : "Submit"}
                        </button>
                    ) : (
                        <>
                            {dataReq.status === "complete" ? (
                                <button
                                    onClick={handleOk}
                                    className="px-5 py-2  bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    OK
                                </button>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={closeModal}
                                        className="text-blue-600 hover:underline text-sm cursor-pointer"
                                    >
                                        Close and check status later
                                    </button>
                                    <button
                                        disabled
                                        className="flex  items-center  gap-2 px-5 py-2 font-medium text-sm rounded-md cursor-not-allowed"
                                        style={{ backgroundColor: bgSub || "#d1d5db", color: textSec || "#374151" }}
                                    >
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Please wait...
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </UploadOnlyModal>
    );
};

export default UploadModal;
