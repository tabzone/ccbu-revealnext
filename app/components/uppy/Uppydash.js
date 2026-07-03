import React from 'react'
import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.css";

const UppyDash = ({ uppy }) => {
  return (
    <div style={{ zIndex: '-99999' }}>
      <Dashboard
        uppy={uppy}
        hideUploadButton={true}
        //   plugins={['Webcam']}
        proudlyDisplayPoweredByUppy={false}
        width={'100%'}
        height={'300px'}
        style={{ border: 0 }}
      />
    </div> 
  )
}
export default UppyDash
