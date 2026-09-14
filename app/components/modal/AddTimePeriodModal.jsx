"use client";
import { useState } from "react";
import Modal from "./Modal";
import ToggleButton from "../toggle/ToggleButton";
import { lambdaPost } from "@/app/lamda/lambdaClient";

export default function AddTimePeriodModal({ fetchTimePeriod }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ timePeriod: "" });
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const closeModal = () => {
    setOpen(false);
    setFormData({ timePeriod: "" });
    setIsActive(false);
    setIsDefault(false);
    setLoading(false);
    fetchTimePeriod?.();
  };

  const handleSubmit = async () => {
    if (!formData.timePeriod) {
      alert("Please enter a time period name");
      return;
    }
    const payload = {
      type: "NEW",
      timeperiod: formData.timePeriod,
      isDefault: isDefault ? 1 : 0,
      isActive: isActive ? 1 : 0,
      sortOrder: 0,
      currentIndex: "",
      previousIndex: "",
    };
    try {
      setLoading(true);
      const data = await lambdaPost("/updatetimeperiod", payload);
      if (data?.status === "Ok") console.log("Time period added Successfully");
      closeModal();
    } catch (error) {
      console.error("Error adding time period:", error);
      alert("Failed to add new time period. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="py-1 px-3 cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700 transition">Add Time Period</button>
      <Modal isOpen={open} onClose={closeModal} maxWidth="max-w-[640px]" maxHeight="max-h-[85vh]">
        <div className="flex flex-col overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-200 flex-shrink-0"><h2 className="text-[18px] font-semibold tracking-tight text-gray-900">Add Time Period</h2></div>
          <div className="flex flex-col gap-5 px-8 py-6">
            <div className="flex flex-col gap-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Time Period Name</label>
              <input type="text" value={formData.timePeriod} onChange={(e) => setFormData({ timePeriod: e.target.value })} placeholder="e.g., Summer 2025" className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="flex items-center gap-6">
              <ToggleButton enabled={isActive} onChange={(state) => setIsActive(state)} activeLabel="Active" inactiveLabel="Inactive" disabled={loading} />
              <ToggleButton enabled={isDefault} onChange={(state) => setIsDefault(state)} activeLabel="Default" inactiveLabel="Not Default" disabled={loading} />
            </div>
          </div>
          <div className="px-8 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50/60 flex-shrink-0">
            <button onClick={closeModal} disabled={loading} className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="cursor-pointer px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : "Submit"}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
