"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { useState } from "react";

const STORES = [
  { id: "STR001", name: "Downtown Flagship", address: "100 Main St", city: "New York", state: "NY", zip: "10001", type: "Flagship", status: "Active" },
  { id: "STR002", name: "Midtown Express", address: "450 Fifth Ave", city: "New York", state: "NY", zip: "10018", type: "Express", status: "Active" },
  { id: "STR003", name: "Brooklyn Hub", address: "200 Atlantic Ave", city: "Brooklyn", state: "NY", zip: "11201", type: "Standard", status: "Active" },
  { id: "STR004", name: "Chicago North", address: "880 N Michigan Ave", city: "Chicago", state: "IL", zip: "60611", type: "Flagship", status: "Active" },
  { id: "STR005", name: "Chicago West", address: "333 W Madison St", city: "Chicago", state: "IL", zip: "60606", type: "Standard", status: "Inactive" },
  { id: "STR006", name: "LA Sunset", address: "8600 Sunset Blvd", city: "Los Angeles", state: "CA", zip: "90069", type: "Standard", status: "Active" },
  { id: "STR007", name: "SF Union Square", address: "170 O Farrell St", city: "San Francisco", state: "CA", zip: "94102", type: "Flagship", status: "Active" },
];

export default function MasterStoresPage() {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All");

  const states = ["All", ...Array.from(new Set(STORES.map((s) => s.state)))];

  const filtered = STORES.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    const matchesState = stateFilter === "All" || s.state === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Master Stores</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Complete store directory for this retailer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Stores", value: STORES.length },
          { label: "Active", value: STORES.filter((s) => s.status === "Active").length },
          { label: "Inactive", value: STORES.filter((s) => s.status === "Inactive").length },
          { label: "States", value: new Set(STORES.map((s) => s.state)).size },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#191919] rounded-2xl border border-slate-200 dark:border-[#333] p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#191919] rounded-2xl border border-slate-200 dark:border-[#333] overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-[#333] flex flex-wrap items-center gap-3">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="border border-slate-300 dark:border-[#444] dark:bg-[#2a2a2a] dark:text-slate-200 rounded-lg px-4 py-2 text-sm outline-none"
          >
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search store ID, name or city..."
            className="ml-auto w-72 px-4 py-2 border border-slate-300 dark:border-[#444] dark:bg-[#2a2a2a] dark:text-slate-200 rounded-lg text-sm outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#2a2a2a]">
                {["Store ID", "Store Name", "Address", "City", "State", "ZIP", "Type", "Status"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#222] transition-colors">
                  <td className="px-6 py-4 text-blue-600 font-medium text-sm">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 text-sm">{row.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.address}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.city}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-medium">{row.state}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.zip}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.status === "Active"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-[#333] text-slate-500 dark:text-slate-400"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 dark:border-[#333] p-4 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">Showing {filtered.length} of {STORES.length} stores</span>
        </div>
      </div>
    </AppLayout>
  );
}
