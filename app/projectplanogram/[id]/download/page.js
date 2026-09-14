"use client";
/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/app/components/layout/AppLayout";
import { lambdaGet } from "@/app/lamda/lambdaClient";

const datasets = [
  { id: "PRD-A", label: "All Products", desc: "Complete product master with matched & unmatched" },
  { id: "PRD-M", label: "Matched Products", desc: "Only matched products" },
  { id: "PRD-U", label: "Unmatched Products", desc: "Products without match" },
  { id: "STR-A", label: "All Stores", desc: "Complete store list" },
  { id: "POG-A", label: "Planograms", desc: "All planogram definitions" },
];

export default function DownloadPage() {
  const { id } = useParams();
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (fileType) => {
    setDownloading(fileType);
    try {
      const res = await lambdaGet(`/downloadurl/${id}/${fileType}`);
      const url = res?.downloadUrl || res?.url || res;
      if (typeof url === "string" && url.startsWith("http")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileType}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Download URL not available");
      }
    } catch (e) {
      console.error(e);
      alert("Download failed: " + e.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col text-gray-700">
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 mb-4">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Download Datasets</p>
          <h1 className="text-lg font-semibold text-gray-900 mt-1">Datasets for Project {id}</h1>
          <p className="text-sm text-gray-500 mt-1">Download validated datasets for analysis</p>
        </div>

        <div className="grid gap-3">
          {datasets.map((ds) => (
            <div key={ds.id} className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{ds.label} <span className="ml-2 font-mono text-xs font-normal text-gray-500">{ds.id}</span></h3>
                <p className="text-xs text-gray-500 mt-1">{ds.desc}</p>
              </div>
              <button onClick={() => handleDownload(ds.id)} disabled={!!downloading} className="px-4 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                {downloading === ds.id ? "Downloading..." : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13M5 10l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17h16" strokeLinecap="round" /></svg>
                    Download
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-600">Project context is preserved: all downloads are scoped to <span className="font-mono font-medium text-gray-800">{id}</span>. The sidebar navigation maintains this ID across all project routes.</p>
        </div>
      </div>
    </AppLayout>
  );
}
