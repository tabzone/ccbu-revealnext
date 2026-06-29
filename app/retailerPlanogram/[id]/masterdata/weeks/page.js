"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { useState } from "react";

const WEEKS = [
  { week: "W01", fiscalYear: "FY2026", startDate: "2025-12-29", endDate: "2026-01-04", period: "P1", salesUploaded: true, planogramActive: true },
  { week: "W02", fiscalYear: "FY2026", startDate: "2026-01-05", endDate: "2026-01-11", period: "P1", salesUploaded: true, planogramActive: true },
  { week: "W03", fiscalYear: "FY2026", startDate: "2026-01-12", endDate: "2026-01-18", period: "P1", salesUploaded: true, planogramActive: false },
  { week: "W04", fiscalYear: "FY2026", startDate: "2026-01-19", endDate: "2026-01-25", period: "P1", salesUploaded: true, planogramActive: true },
  { week: "W05", fiscalYear: "FY2026", startDate: "2026-01-26", endDate: "2026-02-01", period: "P2", salesUploaded: true, planogramActive: true },
  { week: "W06", fiscalYear: "FY2026", startDate: "2026-02-02", endDate: "2026-02-08", period: "P2", salesUploaded: false, planogramActive: false },
  { week: "W07", fiscalYear: "FY2026", startDate: "2026-02-09", endDate: "2026-02-15", period: "P2", salesUploaded: false, planogramActive: false },
  { week: "W08", fiscalYear: "FY2026", startDate: "2026-02-16", endDate: "2026-02-22", period: "P2", salesUploaded: false, planogramActive: false },
];

export default function MasterWeeksPage() {
  const [periodFilter, setPeriodFilter] = useState("All");
  const [search, setSearch] = useState("");

  const periods = ["All", ...Array.from(new Set(WEEKS.map((w) => w.period)))];

  const filtered = WEEKS.filter((w) => {
    const matchesSearch = w.week.toLowerCase().includes(search.toLowerCase());
    const matchesPeriod = periodFilter === "All" || w.period === periodFilter;
    return matchesSearch && matchesPeriod;
  });

  const uploaded = WEEKS.filter((w) => w.salesUploaded).length;
  const withPlanogram = WEEKS.filter((w) => w.planogramActive).length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Weeks Data</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Fiscal week calendar and upload status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Weeks", value: WEEKS.length },
          { label: "Sales Uploaded", value: uploaded },
          { label: "Pending Upload", value: WEEKS.length - uploaded },
          { label: "Planogram Active", value: withPlanogram },
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
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="border border-slate-300 dark:border-[#444] dark:bg-[#2a2a2a] dark:text-slate-200 rounded-lg px-4 py-2 text-sm outline-none"
          >
            {periods.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search week..."
            className="ml-auto w-64 px-4 py-2 border border-slate-300 dark:border-[#444] dark:bg-[#2a2a2a] dark:text-slate-200 rounded-lg text-sm outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#2a2a2a]">
                {["Week", "Fiscal Year", "Period", "Start Date", "End Date", "Sales Uploaded", "Planogram Active"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.week} className="border-b border-slate-100 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#222] transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 text-sm">{row.week}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.fiscalYear}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-medium">{row.period}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.startDate}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.endDate}</td>
                  <td className="px-6 py-4">
                    {row.salesUploaded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {row.planogramActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#333] text-slate-500 dark:text-slate-400 text-xs font-semibold">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 dark:border-[#333] p-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">Showing {filtered.length} of {WEEKS.length} weeks</span>
        </div>
      </div>
    </AppLayout>
  );
}
