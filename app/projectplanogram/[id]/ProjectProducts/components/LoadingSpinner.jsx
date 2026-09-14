import React from "react";

const LoadingSpinner = ({ size = 40, text = "Loading..." }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-0">
      <div
        className="border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"
        style={{ width: size, height: size }}
      ></div>
      {text && (
        <p className="mt-3 text-gray-600 text-sm font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
