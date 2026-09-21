"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { storeExtraction } from "@/app/utils/constants";
import { useRouter } from "next/navigation";
import { lambdaGet, lambdaPost } from "@/app/lamda/lambdaClient";
import { toast } from "react-toastify";

const getRetailerIdValue = (ret) => ret?.retailerid;

export default function CreateProjectModal({ onCreated, retailerId: scopedRetailerId, retailerName: scopedRetailerName }) {
    const isScoped = !!scopedRetailerId;
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);

    const [loadingRetailers, setLoadingRetailers] = useState(false);
    const [retailerList, setRetailerList] = useState([]);
    const [selectedRetailer, setSelectedRetailer] = useState(
        isScoped ? { retailerid: scopedRetailerId, name: scopedRetailerName || scopedRetailerId } : null
    );
    const [submitLoading, setSubmitLoading] = useState(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (isScoped) setSelectedRetailer({ retailerid: scopedRetailerId, name: scopedRetailerName || scopedRetailerId });
    }, [scopedRetailerId, scopedRetailerName, isScoped]);

    // Resolve retailer name dynamically via /getretailers so project name uses name (e.g. Parker's_Kitchen) not id
    useEffect(() => {
        if (!isScoped || scopedRetailerName) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await lambdaGet(`/getretailers`);
                const found = (data?.retailers || []).find(r => String(getRetailerIdValue(r)) === String(scopedRetailerId));
                if (!cancelled && found?.name) {
                    setSelectedRetailer({ retailerid: scopedRetailerId, name: found.name });
                }
            } catch { }
        })();
        return () => { cancelled = true; };
    }, [isScoped, scopedRetailerId, scopedRetailerName]);

    // Store Extraction is hidden from the UI but still required in the payload.
    // Default: "From File Name / Use PSA File Name"
    const defaultStoreExtractionParent = storeExtraction.find(
        (p) => p.label === "From File Name"
    );
    const defaultStoreExtractionChild = defaultStoreExtractionParent?.children?.find(
        (c) => c.label === "Use PSA File Name"
    );
    const DEFAULT_SLKEY = defaultStoreExtractionChild?.value ?? 1;

    const [formData, setFormData] = useState({
        timePeriod: "",
    });

    const [timePeriodList, setTimePeriodList] = useState([]);
    const [timePeriodLoading, setTimePeriodLoading] = useState(false);

    const router = useRouter()

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = String(today.getFullYear()).substring(2);
    const todays = mm + dd + yyyy;

    const projectName =
        `Recap_Parker's_Kitchen_${String(formData.timePeriod || "").replace(/ /g, "_")}_${todays}`;

    const formattedProjectName = projectName?.replace(/\s+/g, "_");


    const step1Valid = isScoped ? true : !!selectedRetailer;
    const step2Valid = !!formData.timePeriod;
    // When scoped, step 1 = timePeriod, step 2 = review; when global, step 1 = retailer, step 2 = timePeriod, step 3 = review
    const maxStep = isScoped ? 2 : 3;

    const getRetailerList = async () => {
        try {
            setLoadingRetailers(true);
            const data = await lambdaGet(`/getretailers`);
            setRetailerList(data?.retailers || []);
        } catch (err) {
            console.error("Error getting retailer list:", err);
        } finally {
            setLoadingRetailers(false);
        }
    };

    const getTimePeriodList = async () => {
        try {
            console.log('api checkd ')
            setTimePeriodLoading(true);
            const data = await lambdaGet(`/gettimeperiod`);
            console.log(data, 'data checkd ')
            setTimePeriodList(data[0]?.period || data?.data || data || []);
        } catch (err) {
            console.error("Error getting time period list:", err);
            setTimePeriodList([]);
        } finally {
            setTimePeriodLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const openModal = () => {
        setOpen(true);
        if (isScoped) {
            // scoped mode: keep retailer fixed, fetch time periods immediately for dropdown
            setSelectedRetailer({ retailerid: scopedRetailerId, name: scopedRetailerName || scopedRetailerId });
            getTimePeriodList();
        } else {
            getRetailerList();
        }
    };

    const closeModal = () => {
        setOpen(false);
        setStep(1);
        setFormData({
            timePeriod: "",
        });

        setRetailerList([]);
        if (!isScoped) setSelectedRetailer(null);
        else setSelectedRetailer({ retailerid: scopedRetailerId, name: scopedRetailerName || scopedRetailerId });
    };

    const handleSubmit = async () => {
        try {
            setSubmitLoading(true);

            const retailerId = getRetailerIdValue(selectedRetailer);

            const formattedProjName = formattedProjectName;

            const payload = {
                projName: formattedProjName,
                projTime: formData?.timePeriod,
                retailID: retailerId,
                baseCallPoints: retailerId,
                category: "ssd",
                multiBase: false,
                slkey: DEFAULT_SLKEY,
                setStatus: "Final"
            };
            // Direct API call - no Next.js /api route (see app/lamda/projectApi.js for global reuse)
            const data = await lambdaPost("/createproject", payload);
            toast.success("Project created successfully! Please wait, redirecting to uploads...");
            if (onCreated) onCreated(data);
            setTimeout(() => {
                const rid = scopedRetailerId || getRetailerIdValue(selectedRetailer);
                if (rid) router.push(`/retailerPlanogram/${rid}/projectplanogram/${data?.projectid}/uploads`);
                else router.push(`/projectplanogram/${data?.projectid}/uploads`);
            }, 800);
        } catch (err) {
            console.error("Error submitting project:", err);
            toast.error(err?.message || "Failed to create project");
        }
        finally {
            setSubmitLoading(false)
        }
    };


    return (
        <>
            <button
                onClick={openModal}
                className="py-1 px-3 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Create Project
            </button>

            <Modal isOpen={open} onClose={closeModal} maxWidth="max-w-[640px]" maxHeight="max-h-[85vh]">
                <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 flex-shrink-0">
                        <div>
                            <h2 className="text-[18px] font-semibold tracking-tight text-gray-900">Create project</h2>
                            <p className="mt-1 text-sm text-gray-500">Set up a new planogram project</p>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="ml-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                            aria-label="Close"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-0 px-8 py-5 border-b border-gray-100 bg-white flex-shrink-0">
                        {(isScoped ? ["Project settings", "Review"] : ["Select retailer", "Project settings", "Review"]).map((label, index) => {
                            const count = index + 1;
                            const active = step === count;
                            const completed = step > count;
                            return (
                                <div key={count} className="flex flex-1 items-center gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${active
                                                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                                                : completed
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-gray-300 bg-white text-gray-500"
                                                }`}
                                        >
                                            {completed ? (
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                                            ) : count}
                                        </div>
                                        <span className={`text-sm ${active ? "font-semibold text-gray-900" : completed ? "font-medium text-gray-700" : "font-medium text-gray-500"}`}>
                                            {label}
                                        </span>
                                    </div>
                                    {index < (isScoped ? 1 : 2) && (
                                        <div className={`mx-3 hidden h-px flex-1 sm:block ${completed ? "bg-blue-600" : "bg-gray-200"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-7">
                        {!isScoped && step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Retailer <span className="text-red-500">*</span></label>
                                    <p className="mb-3 text-xs text-gray-500">Choose the retailer this project belongs to</p>
                                    <select
                                        value={selectedRetailer ? getRetailerIdValue(selectedRetailer) : ""}
                                        onChange={(e) => {
                                            const ret = retailerList.find(
                                                (r) => String(getRetailerIdValue(r)) === e.target.value
                                            );
                                            setSelectedRetailer(ret || null);
                                        }}
                                        disabled={loadingRetailers || retailerList.length === 0}
                                        className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${loadingRetailers || retailerList.length === 0 ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400" : "border-gray-300"
                                            }`}
                                    >
                                        <option value="">
                                            {loadingRetailers
                                                ? "Please wait, Loading retailers..."
                                                : retailerList.length === 0
                                                    ? "Please update store master first"
                                                    : "Please Select"}
                                        </option>
                                        {retailerList.map((ret) => {
                                            const id = getRetailerIdValue(ret);
                                            return (
                                                <option key={id} value={id}>
                                                    {ret.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        )}
                        {(isScoped ? step === 1 : step === 2) && (
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Time period <span className="text-red-500">*</span></label>
                                    <p className="mb-3 text-xs text-gray-500">Select the fiscal period for this recap</p>
                                    <select
                                        value={formData.timePeriod}
                                        onChange={(e) => handleChange("timePeriod", e.target.value)}
                                        disabled={timePeriodLoading || timePeriodList.length === 0}
                                        className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${timePeriodLoading || timePeriodList.length === 0 ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400" : "border-gray-300"
                                            }`}
                                    >
                                        <option value="">
                                            {timePeriodLoading
                                                ? "Please wait, Loading time periods..."
                                                : timePeriodList.length === 0
                                                    ? "No time periods available"
                                                    : "Please Select"}
                                        </option>
                                        {timePeriodList.map((item) => {
                                            const value = item?.value || item?.id || item?.dis || String(item);
                                            const label = item?.label || item?.name || item?.dis || String(item);
                                            return (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        )}

                        {(isScoped ? step === 2 : step === 3) && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold tracking-wide text-gray-900">Review project details</h3>
                                <p className="text-xs text-gray-500">Confirm the information before creating</p>
                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-3">
                                    {[
                                        ["Project Name", formattedProjectName],
                                        ["Retailer", "Parker's Kitchen"],
                                        ["Time Period", formData.timePeriod],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">{label}:</span>
                                            <span className="text-sm text-gray-900">
                                                {value || "-"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/60 px-8 py-4 flex-shrink-0">
                        <button
                            type="button"
                            disabled={submitLoading}
                            onClick={closeModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-2">
                            {step > 1 && (
                                <button
                                    type="button"
                                    disabled={submitLoading}
                                    onClick={() => setStep((s) => s - 1)}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
                                >
                                    Back
                                </button>
                            )}
                            {step < maxStep ? (
                                <button
                                    type="button"
                                    disabled={isScoped ? !step2Valid : (step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                                    onClick={async () => {
                                        if (!isScoped && step === 1) {
                                            await getTimePeriodList();
                                        }
                                        if (isScoped && step === 1 && timePeriodList.length === 0) {
                                            await getTimePeriodList();
                                        }
                                        setStep((s) => s + 1);
                                    }}
                                    className={`rounded-lg px-5 py-2 text-sm font-semibold shadow-sm transition ${(isScoped ? !step2Valid : ((step === 1 && !step1Valid) || (step === 2 && !step2Valid)))
                                        ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={submitLoading}
                                    onClick={handleSubmit}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition"
                                >
                                    {submitLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                    {submitLoading ? 'Creating...' : 'Create project'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
