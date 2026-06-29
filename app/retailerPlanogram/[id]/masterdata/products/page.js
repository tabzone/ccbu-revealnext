"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { useState } from "react";

const PRODUCTS = [
  { upc: "7618332850", name: "Sparkling Water 16oz", manufacturer: "Company A", category: "Beverages", subCategory: "Water", size: "16oz", status: "Active" },
  { upc: "1200002721", name: "Energy Drink 12oz", manufacturer: "Company B", category: "Energy", subCategory: "Can", size: "12oz", status: "Active" },
  { upc: "4890008100", name: "Chocolate Bar 2.5oz", manufacturer: "Company C", category: "Confectionery", subCategory: "Chocolate", size: "2.5oz", status: "Active" },
  { upc: "0360014828", name: "Potato Chips 6oz", manufacturer: "Company D", category: "Snacks", subCategory: "Chips", size: "6oz", status: "Active" },
  { upc: "8901030867", name: "Orange Juice 32oz", manufacturer: "Company E", category: "Beverages", subCategory: "Juice", size: "32oz", status: "Inactive" },
  { upc: "0051000126", name: "Breakfast Cereal 18oz", manufacturer: "Company F", category: "Breakfast", subCategory: "Cereal", size: "18oz", status: "Active" },
];

export default function MasterProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];

  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.upc.includes(search);
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Master Products</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Complete product catalogue for this retailer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: PRODUCTS.length },
          { label: "Active", value: PRODUCTS.filter((p) => p.status === "Active").length },
          { label: "Inactive", value: PRODUCTS.filter((p) => p.status === "Inactive").length },
          { label: "Categories", value: new Set(PRODUCTS.map((p) => p.category)).size },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#191919] rounded-2xl border border-slate-200 dark:border-[#333] p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#191919] rounded-2xl border border-slate-200 dark:border-[#333] overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-[#333] flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-300 dark:border-[#444] dark:bg-[#2a2a2a] dark:text-slate-200 rounded-lg px-4 py-2 text-sm outline-none"
          >
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search UPC or product name..."
            className="ml-auto w-72 px-4 py-2 border border-slate-300 dark:border-[#444] dark:bg-[#2a2a2a] dark:text-slate-200 rounded-lg text-sm outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#2a2a2a]">
                {["UPC", "Product Name", "Manufacturer", "Category", "Sub Category", "Size", "Status"].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.upc} className="border-b border-slate-100 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#222] transition-colors">
                  <td className="px-6 py-4 text-blue-600 font-medium text-sm">{row.upc}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 text-sm">{row.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.manufacturer}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">{row.category}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.subCategory}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{row.size}</td>
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
          <span className="text-sm text-slate-500 dark:text-slate-400">Showing {filtered.length} of {PRODUCTS.length} products</span>
        </div>
      </div>
    </AppLayout>
  );
}
