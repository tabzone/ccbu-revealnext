"use client";
import { useState, useEffect } from "react";

export default function ToggleButton({
  enabled = false,
  onChange,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  disabled = false,
}) {
  const [isOn, setIsOn] = useState(enabled);

  useEffect(() => {
    setIsOn(enabled);
  }, [enabled]);

  const handleToggle = () => {
    if (disabled) return;
    const prevState = isOn;
    const newState = !isOn;
    setIsOn(newState);
    const revert = () => setIsOn(prevState);
    onChange?.(newState, revert);
  };

  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-gray-700 text-sm">{isOn ? activeLabel : inactiveLabel}</span>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${isOn ? "bg-blue-600" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${isOn ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
