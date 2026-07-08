"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiPost } from "@/lib/api";

const EMPTY_WEEK_FORM = { fiscal_week: "", dataweek: "", year: "" };

/**
 * Create Week modal.
 * retailerId  – used to build the POST /retailers/{rid}/weeks path
 * onCreated(result) – called on success with the API result
 */
export function CreateWeekModal({ retailerId, onClose, onCreated, theme }) {
  const { bg, bgSub, border, textPri, textSec, accent } = theme;
  const [form, setForm] = useState({ ...EMPTY_WEEK_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fiscalWeek = form.fiscal_week.trim();
    const dataWeek = form.dataweek.trim();
    const year = form.year.trim();

    if (!fiscalWeek || !dataWeek || !year) {
      setError("Fiscal Week, Data Week, and Year are all required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await apiPost(`/retailers/${retailerId}/weeks`, {
        fiscal_week: fiscalWeek,
        dataweek: dataWeek,
        year,
      });
      onCreated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    backgroundColor: bgSub,
    border: `1px solid ${border}`,
    color: textPri,
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={saving ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: bg, borderColor: border }}
        className="w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: border }}>
          <h2 className="text-xl font-semibold" style={{ color: textPri }}>Create Week</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-2xl cursor-pointer leading-none transition hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: textSec }}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
                Fiscal Week<span style={{ color: accent }}> *</span>
              </label>
              <input
                type="date"
                value={form.fiscal_week}
                onChange={set("fiscal_week")}
                required
                disabled={saving}
                style={inputStyle}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
                Data Week<span style={{ color: accent }}> *</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.dataweek}
                onChange={set("dataweek")}
                required
                placeholder="e.g. 27"
                disabled={saving}
                style={inputStyle}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
                Year<span style={{ color: accent }}> *</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.year}
                onChange={set("year")}
                required
                placeholder="e.g. 2026"
                disabled={saving}
                style={inputStyle}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: border }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border cursor-pointer px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: border, color: textSec }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-w-[110px] cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: accent }}
            >
              {saving && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {saving ? "Creating..." : "Create Week"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
