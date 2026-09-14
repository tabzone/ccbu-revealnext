"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/app/components/layout/AppLayout";
import { lambdaGet, lambdaPost } from "@/app/lamda/lambdaClient";

export default function SubmitReportPage() {
  const { id } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    try { const data = await lambdaGet(`/getproject/${id}`); setProjectData(data?.project || data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishStatus(null);
    try {
      const data = await lambdaPost("/publishproject", { projectid: id });
      setPublishStatus({ type: "success", msg: data?.message || "Project published successfully" });
    } catch (e) {
      setPublishStatus({ type: "error", msg: e.message || "Publish failed" });
    } finally { setPublishing(false); }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col text-gray-700 max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 mb-4">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Publish for Reporting</p>
          <h1 className="text-lg font-semibold text-gray-900 mt-1">Submit Report</h1>
          <p className="text-sm text-gray-500 mt-1">Project <span className="font-mono font-medium text-gray-700">{id}</span></p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {loading ? <p className="text-sm text-gray-500">Loading project...</p> : (
            <>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Project Name</span><span className="font-medium text-gray-900">{projectData?.projName || "-"}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Time Period</span><span className="font-medium text-gray-900">{projectData?.projectTime || "-"}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Status</span><span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{projectData?.status || "In-Progress"}</span></div>
                <div className="flex justify-between py-2"><span className="text-gray-500">Project ID</span><span className="font-mono text-gray-900">{id}</span></div>
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-amber-900">Ready to publish?</p>
                <p className="text-xs text-amber-700 mt-1">Publishing will make this planogram available for reporting. This action cannot be undone.</p>
              </div>

              {publishStatus && (
                <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${publishStatus.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                  {publishStatus.msg}
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <button onClick={handlePublish} disabled={publishing} className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {publishing ? "Publishing..." : "Publish for Reporting"}
                </button>
                <button onClick={fetchProject} className="px-4 py-2.5 text-sm border border-gray-300 rounded hover:bg-gray-50">Refresh</button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
