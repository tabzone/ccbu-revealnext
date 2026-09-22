"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { useParams } from "next/navigation";
import { lambdaGet } from "@/app/lamda/lambdaClient";

const PublishModal = ({
    open,
    setOpen,
    updateRequest,
    createProjRequest,
    createReqData,
    setCreateReqData,
    validationData,
    setValidationData,
    createReqLoading,
    validationLoading,
    fetchProjectRequestData,
    theme,
}) => {
    const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = theme || {};
    const [step, setStep] = useState(1);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [process, setProcess] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [dataReq, setdataReq] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [projectTotalLoading, setProjectTotalLoading] = useState(false);
    const [projectTotalData, setProjectTotalData] = useState(null);
    const [storeList, setStoreList] = useState([]);
    const [storeLoading, setStoreLoading] = useState(false);
    const [storeError, setStoreError] = useState(null);
    const [selectedExcludedStores, setSelectedExcludedStores] = useState([]);
    const [initialExcludedIds, setInitialExcludedIds] = useState([]);

    const { retailerId, projectId } = useParams();

    const getStoreId = (store) => {
        if (store == null) return "";
        if (typeof store === "string" || typeof store === "number") return String(store).trim();
        return String(
            store?.storenumber ??
            store?.storeNumber ??
            store?.store_number ??
            store?.storeid ??
            store?.storeId ??
            store?.store_id ??
            store?.id ??
            store?.storeID ??
            ""
        ).trim();
    };

    const getStoreLabel = (store) => {
        const sid = getStoreId(store);
        const name = store?.storename ?? store?.storeName ?? store?.name ?? store?.storeaddress1 ?? "";
        return name ? `${sid} — ${name}` : sid || "Unknown store";
    };

    const fetchStores = async () => {
        if (!projectId || !retailerId) return;
        try {
            setStoreLoading(true);
            setStoreError(null);
            const data = await lambdaGet(`/projectstorelist/${retailerId}/${projectId}`);
            let list = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.data)) list = data.data;
            else if (Array.isArray(data?.stores)) list = data.stores;
            else if (Array.isArray(data?.storeList)) list = data.storeList;
            else if (Array.isArray(data?.storelist)) list = data.storelist;
            else if (Array.isArray(data?.data?.stores)) list = data.data.stores;
            else if (Array.isArray(data?.data?.storeList)) list = data.data.storeList;
            else list = [];
            setStoreList(list);
        } catch (err) {
            console.error("Error fetching stores:", err);
            setStoreError(err.message || "Failed to load stores");
            setStoreList([]);
        } finally {
            setStoreLoading(false);
        }
    };

    // Fetch project totals
    const fetchProjectTotals = async () => {
        try {
            setProjectTotalLoading(true);
            const data = await lambdaGet(`/projecttotals/${projectId}`);
            if (!data || data.error) {
                console.log(data.error);
                return;
            }
            setProjectTotalData(data);
            const rawExcluded =
                data?.excludedstores ??
                data?.excludedStores ??
                data?.data?.excludedstores ??
                data?.data?.excludedStores ??
                data?.data?.data?.excludedstores ??
                null;
            let normalizedExcluded = [];
            if (Array.isArray(rawExcluded)) {
                const seen = new Set();
                for (const v of rawExcluded) {
                    const s = String(v ?? "").trim();
                    if (!s || seen.has(s)) continue;
                    seen.add(s);
                    normalizedExcluded.push(s);
                }
            }
            setSelectedExcludedStores(normalizedExcluded);
            setInitialExcludedIds(normalizedExcluded);
        } catch (err) {
            console.error("Error fetching totals:", err);
            setUploadError(err.message);
        } finally {
            setProjectTotalLoading(false);
        }
    };

    const pollGetRequest = async (projectId, requestId, filetype) => {
        setStep(3);
        const pollInterval = 5000;
        const maxRetries = 60;
        let attempts = 0;

        setIsPolling(true);
        console.log("Polling started...");

        while (attempts < maxRetries) {
            try {
                const data = await lambdaGet(`/getrequest/${projectId}/${requestId}/${filetype}`);
                const status = data?.data?.s || data?.status;
                if (status === "complete" || status === "error") {
                    setdataReq(data?.data || data);
                    setIsPolling(false);
                    return;
                }

                if (status === "processing") {
                    await new Promise((r) => setTimeout(r, pollInterval));
                    attempts++;
                } else {
                    console.warn("Unknown status:", status);
                    break;
                }
            } catch (err) {
                console.error("Polling error:", err);
                await new Promise((r) => setTimeout(r, pollInterval));
                attempts++;
            }
        }

        console.warn("⏰ Polling timed out");
        setIsPolling(false);
        setdataReq({ s: "timeout", message: "Request timed out" });
        setStep(3);
    };


    // Handle Submit
    const handleSubmit = async () => {

        try {
            setSubmitLoading(true);
            setProcess(true);

            const normalizedExcludedStores = Array.isArray(selectedExcludedStores)
                ? selectedExcludedStores.map((s) => String(s).trim()).filter(Boolean)
                : [];

            const res = await updateRequest(
                [],
                "",
                "",
                1,
                "",
                "SUB",
                false,
                projectId,
                "",
                createReqData?.requestid,
                "processing",
                normalizedExcludedStores
            );

            const status = res?.Attributes?.s || res?.s;

            if (status === "processing") {
                console.log("Starting polling...");
                await pollGetRequest(projectId, createReqData?.requestid, "SUB");

            } else {
                setdataReq(res?.data || res);
                setStep(3);
            }
        } catch (err) {
            console.error("Submit failed:", err);
            setUploadError("Submit failed: " + err.message);
            setdataReq({ s: "error", message: err.message });
            setStep(3);
        } finally {
            setSubmitLoading(false);
            setProcess(false);
        }
    };

    useEffect(() => {
        if (step === 2 && projectId) {
            fetchStores();
        }
    }, [step, projectId]);

    const toggleStore = (storeId) => {
        const sid = String(storeId).trim();
        if (!sid) return;
        setSelectedExcludedStores((prev) =>
            prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid]
        );
    };

    const handleSelectAllStores = () => {
        const allIds = storeList.map(getStoreId).filter(Boolean).map(String);
        setSelectedExcludedStores(allIds);
    };

    const handleClearAllStores = () => {
        setSelectedExcludedStores([]);
    };

    const orderedStoreList = useMemo(() => {
        if (!storeList.length) return [];
        const baseIds = initialExcludedIds.length ? initialExcludedIds : (Array.isArray(selectedExcludedStores) ? selectedExcludedStores : []);
        const baseSet = new Set(baseIds.map((s) => String(s ?? "").trim()).filter(Boolean));
        if (baseSet.size === 0) return storeList;
        const excluded = [];
        const rest = [];
        for (const store of storeList) {
            const sid = String(getStoreId(store) ?? "").trim();
            if (sid && baseSet.has(sid)) excluded.push(store);
            else rest.push(store);
        }
        return [...excluded, ...rest];
    }, [storeList, initialExcludedIds, selectedExcludedStores]);

    const handleOk = () => {
        setIsPolling(false);
        setStep(1);
        setdataReq(null);
        setUploadError(null);
        setSelectedExcludedStores([]);
        setInitialExcludedIds([]);
        setStoreList([]);
        setStoreError(null);
        setOpen();
        setCreateReqData(null)
        fetchProjectRequestData('SUB')
    };

    const handleCancel = () => {
        setOpen();
        setStep(1);
        setUploadError(null);
        setdataReq(null);
        setSelectedExcludedStores([]);
        setInitialExcludedIds([]);
        setStoreList([]);
        setStoreError(null);
        setCreateReqData(null)
        setValidationData(null)
        fetchProjectRequestData('SUB')
        const isSafeToCancel = !submitLoading && !process && step < 3;
        if (isSafeToCancel) {
            updateRequest(projectId, createReqData?.requestid, "cancel", 0, "PSA", "", "", []);
        }
    };



    return (
        <Modal isOpen={open} onClose={handleCancel} maxWidth="max-w-4xl" maxHeight="h-[500px]">
            <div className="h-full flex flex-col -m-6">
                <div className="px-6 py-4 border-b" style={{ borderColor: border || "#e5e7eb" }}>
                    <h2 className="text-lg font-semibold" style={{ color: textPri || "#111827" }}>Submit Report</h2>
                </div>

                <div className="flex items-center gap-6 px-6 py-4 border-b" style={{ borderColor: border || "#e5e7eb" }}>
                    {["Select Report Type", "Review And Submit", "Check Status"].map((label, i) => {
                        const count = i + 1;
                        return (
                            <div
                                key={count}
                                className={`flex items-center gap-2 w-full justify-center py-2 border-b-2 ${step === count ? "border-blue-500" : "border-transparent"
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 flex items-center justify-center rounded-full border ${step >= count
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "border"
                                        }`}
                                    style={step >= count ? {} : { backgroundColor: bgSub || "#f9fafb", color: textSec || "#6b7280", borderColor: border || "#e5e7eb" }}
                                >
                                    {step > count ? "✓" : count}
                                </div>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: step === count ? "#2563eb" : (textSec || "#6b7280") }}
                                >
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex-1 px-6 py-4 overflow-auto min-h-[300px]">
                    {uploadError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {uploadError}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="shadow rounded-lg p-4" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
                            {validationLoading ? (
                                <div className="flex items-center gap-2 w-full justify-center">
                                    <div
                                        className="border-4 border-t-blue-600 rounded-full animate-spin"
                                        style={{ width: 32, height: 32, borderColor: border || "#e5e7eb", borderTopColor: "#2563eb" }}
                                    />
                                    <p className="text-blue-600 animate-pulse">Loading...</p>
                                </div>
                            ) : !validationData ? (
                                <div className="flex items-center justify-center py-10" style={{ color: textSec || "#6b7280" }}>
                                    Waiting for validation results...
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={`flex items-center justify-between p-3 mb-4 border-l-4 rounded ${validationData?.status === "failed"
                                            ? "border-red-500 bg-red-50 text-red-700"
                                            : validationData?.status === "Not Validated"
                                                ? "border-gray-300 bg-gray-50 text-gray-700"
                                                : validationData?.status === "warning"
                                                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                                                    : "border-green-500 bg-green-50 text-green-700"
                                            }`}
                                    >
                                        <span className="font-medium text-sm">
                                            {validationData?.status === "failed"
                                                ? "Validation Failed"
                                                : validationData?.status === "Not Validated"
                                                    ? "Not Validated"
                                                    : validationData?.status === "warning"
                                                        ? "Validation Warning"
                                                        : "Validation Success"}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {validationData?.messages?.length > 0 ? (
                                            validationData.messages.map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center p-3 border-l-4 rounded"
                                                    style={{ borderColor: border || "#e5e7eb", backgroundColor: bgSub || "#f9fafb", color: textPri || "#1f2937" }}
                                                >
                                                    <span className="text-sm">{msg.split("#")[0]}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-center py-2" style={{ color: textSec || "#6b7280" }}>
                                                No validation messages.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}


                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap justify-center gap-4">
                                {projectTotalLoading || submitLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="border-4 border-t-blue-600 rounded-full animate-spin"
                                            style={{ width: 32, height: 32, borderColor: border || "#e5e7eb", borderTopColor: "#2563eb" }}
                                        />
                                        <p className="text-blue-600 animate-pulse">Loading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-full sm:w-1/4 p-2">
                                            <div className="shadow rounded-lg p-4 text-center" style={{ backgroundColor: bg || "#fff" }}>
                                                <p className="text-sm" style={{ color: textSec || "#6b7280" }}>Total Planograms</p>
                                                <span className="text-2xl font-semibold text-blue-600">
                                                    {projectTotalData?.totalplanograms ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-1/4 p-2">
                                            <div className="shadow rounded-lg p-4 text-center" style={{ backgroundColor: bg || "#fff" }}>
                                                <p className="text-sm" style={{ color: textSec || "#6b7280" }}>Total Products</p>
                                                <span className="text-2xl font-semibold text-blue-600">
                                                    {projectTotalData?.totalproducts ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-1/4 p-2">
                                            <div className="shadow rounded-lg p-4 text-center" style={{ backgroundColor: bg || "#fff" }}>
                                                <p className="text-sm" style={{ color: textSec || "#6b7280" }}>Total Stores</p>
                                                <span className="text-2xl font-semibold text-blue-600">
                                                    {projectTotalData?.totalstores ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Stores Exclude multi-select */}
                            <div className="border rounded-lg" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
                                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border || "#e5e7eb" }}>
                                    <div>
                                        <h3 className="text-sm font-semibold" style={{ color: textPri || "#1f2937" }}>Stores Exclude</h3>
                                        <p className="text-xs" style={{ color: textSec || "#6b7280" }}>
                                            {selectedExcludedStores.length > 0
                                                ? `${selectedExcludedStores.length} store(s) excluded`
                                                : "No stores excluded — all stores will be included"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllStores}
                                            disabled={storeLoading || !storeList.length}
                                            className="text-xs px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed"
                                            style={{ borderColor: border || "#e5e7eb", backgroundColor: bg || "#fff", color: textPri || "#1f2937" }}
                                            onMouseEnter={(e) => { if (hover) e.currentTarget.style.backgroundColor = hover; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || "#fff"; }}
                                        >
                                            Select all
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearAllStores}
                                            disabled={!selectedExcludedStores.length}
                                            className="text-xs px-3 py-1 rounded border disabled:opacity-40 disabled:cursor-not-allowed"
                                            style={{ borderColor: border || "#e5e7eb", backgroundColor: bg || "#fff", color: textPri || "#1f2937" }}
                                            onMouseEnter={(e) => { if (hover) e.currentTarget.style.backgroundColor = hover; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || "#fff"; }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3">
                                    {storeLoading ? (
                                        <div className="flex items-center justify-center gap-2 py-8">
                                            <div className="border-4 border-t-blue-600 rounded-full animate-spin" style={{ width: 24, height: 24, borderColor: border || "#e5e7eb", borderTopColor: "#2563eb" }} />
                                            <span className="text-sm" style={{ color: textSec || "#6b7280" }}>Loading stores...</span>
                                        </div>
                                    ) : storeError ? (
                                        <div className="text-sm bg-red-50 border border-red-200 rounded p-3" style={{ color: "#dc2626" }}>
                                            Failed to load stores: {storeError}
                                        </div>
                                    ) : !storeList.length ? (
                                        <div className="text-sm text-center py-6" style={{ color: textSec || "#6b7280" }}>No stores available</div>
                                    ) : (
                                        <div className="max-h-[220px] overflow-auto border rounded divide-y" style={{ borderColor: border || "#e5e7eb" }}>
                                            {orderedStoreList.map((store, idx) => {
                                                const sid = String(getStoreId(store) ?? "").trim();
                                                const normalizedSelected = (Array.isArray(selectedExcludedStores) ? selectedExcludedStores : []).map((s) => String(s ?? "").trim()).filter(Boolean);
                                                const checked = normalizedSelected.includes(sid);
                                                return (
                                                    <label
                                                        key={`${sid}-${idx}`}
                                                        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                                                        style={{ backgroundColor: checked ? (isDark ? "#1f2937" : "#eff6ff99") : "transparent" }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover || "#f9fafb"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = checked ? (isDark ? "#1f2937" : "#eff6ff99") : "transparent"; }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleStore(sid)}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm truncate" style={{ color: textPri || "#1f2937" }} title={getStoreLabel(store)}>
                                                            {getStoreLabel(store)}
                                                        </span>
                                                        <span className="ml-auto text-xs shrink-0" style={{ color: textSec || "#9ca3af" }}>{sid}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="mt-10 w-full flex justify-center">

                            {isPolling ? (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="border-4 border-t-blue-600 rounded-full animate-spin"
                                        style={{ width: 32, height: 32, borderColor: border || "#e5e7eb", borderTopColor: "#2563eb" }}
                                    />
                                    <p className="text-blue-600 animate-pulse">Loading...</p>
                                </div>
                            ) : (
                                <>
                                    {dataReq?.status === "complete" ? (
                                        <p className="text-green-600">Request Completed Successfully</p>
                                    ) : dataReq?.status === "processing" ? (
                                        <p className="text-blue-500">Processing...</p>
                                    ) : dataReq?.status === "error" ? (
                                        <p className="text-red-600">Error: {dataReq?.message}</p>
                                    ) : dataReq?.status === "timeout" ? (
                                        <p className="text-yellow-600">Timeout: Request took too long</p>
                                    ) : (
                                        <p style={{ color: textSec || "#6b7280" }}>No status yet.</p>
                                    )}
                                </>
                            )}

                        </div>
                    )}


                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ backgroundColor: bg || "#fff", borderColor: border || "#e5e7eb" }}>
                    {step === 1 && (
                        <>
                            <button
                                onClick={handleCancel}
                                className="cursor-pointer px-4 py-2 text-sm border rounded"
                                style={{ borderColor: border || "#e5e7eb", color: textPri || "#374151", backgroundColor: bg || "#fff" }}
                                onMouseEnter={(e) => { if (hover) e.currentTarget.style.backgroundColor = hover; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = bg || "#fff"; }}
                            >
                                Cancel
                            </button>
                            <button
                                disabled={createReqLoading || validationLoading}
                                onClick={() => {
                                    setStep(2);
                                    fetchProjectTotals();
                                }}
                                className="cursor-pointer px-4 py-2 disabled:opacity-40 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Next
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <button
                            disabled={projectTotalLoading || submitLoading}
                            onClick={handleSubmit}
                            className="cursor-pointer px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitLoading ? "Submitting..." : "Submit"}
                        </button>
                    )}

                    {step === 3 && (
                        <>
                            {dataReq?.s === "complete" ? (
                                <button
                                    onClick={handleOk}
                                    className="cursor-pointer px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    OK
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancel}
                                    className="cursor-pointer px-5 py-2 text-blue-600 underline rounded hover:text-blue-700"
                                >
                                    Close
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default PublishModal;
