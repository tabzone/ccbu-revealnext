"use client";

import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

export default function UppyDashboard({ uppy, uploadType }) {
  return (
    <div className={`relative w-full h-full ${uploadType === 'folder' ? 'folder-mode' : ''}`}>
      <Dashboard
        uppy={uppy}
        theme="light"
        proudlyDisplayPoweredByUppy={false}
        height={260}
        width="100%"
        hideUploadButton
        showProgressDetails={true}
        note="Upload only .xlsx or .csv files"
        fileManagerSelectionType={uploadType}
        disableStatusBar
      />
    </div>
  );
}
