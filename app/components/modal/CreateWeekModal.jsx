"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiGet, apiPost } from "@/lib/api";

const EMPTY_WEEK_FORM = { fiscal_week: "", dataweek: "", projectid: "" };
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatFiscalWeek(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [fiscalWeekPickerOpen, setFiscalWeekPickerOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState(null);
  const fiscalWeekButtonRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!retailerId) return;

    setProjectsLoading(true);
    apiGet(`/retailers/listprojects/${retailerId}`)
      .then((res) => {
        const payload = res?.data ?? res;
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.projects)
            ? payload.projects
            : Array.isArray(payload?.items)
              ? payload.items
              : [];
        setProjects(rows);
      })
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, [retailerId]);

  useEffect(() => {
    if (!fiscalWeekPickerOpen) return undefined;

    const updatePickerPosition = () => {
      const rect = fiscalWeekButtonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const width = Math.min(rect.width, window.innerWidth - (viewportPadding * 2));
      setPickerPosition({
        top: rect.bottom + 8,
        left: Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding),
        width,
        maxHeight: Math.max(0, window.innerHeight - rect.bottom - 24),
      });
    };

    updatePickerPosition();
    window.addEventListener("resize", updatePickerPosition);
    window.addEventListener("scroll", updatePickerPosition, true);
    return () => {
      window.removeEventListener("resize", updatePickerPosition);
      window.removeEventListener("scroll", updatePickerPosition, true);
    };
  }, [fiscalWeekPickerOpen]);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openFiscalWeekPicker = () => {
    if (fiscalWeekPickerOpen) {
      setFiscalWeekPickerOpen(false);
      setPickerPosition(null);
      return;
    }

    if (form.fiscal_week) {
      const [year, month] = form.fiscal_week.split("-").map(Number);
      setCalendarMonth(new Date(year, month - 1, 1));
    }
    setFiscalWeekPickerOpen(true);
  };

  const selectFiscalWeek = (date) => {
    setForm((prev) => ({ ...prev, fiscal_week: toIsoDate(date) }));
    setFiscalWeekPickerOpen(false);
    setPickerPosition(null);
  };

  const changeCalendarMonth = (offset) => {
    setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fiscalWeek = form.fiscal_week;
    const year = fiscalWeek.slice(0, 4);
    const dataWeek = form.dataweek.trim();
    // const projectId = form.projectid.trim();

    if (!fiscalWeek || !dataWeek) {
      setError("Data Week and Fiscal Week are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await apiPost(`/retailers/${retailerId}/weeks`, {
        fiscal_week: fiscalWeek,
        // fiscal_date: fiscalDate,
        year,
        dataweek: dataWeek,
        // projectid: projectId,
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

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarDays = Array.from(
    { length: new Date(calendarYear, calendarMonthIndex + 1, 0).getDate() },
    (_, index) => new Date(calendarYear, calendarMonthIndex, index + 1),
  );
  const calendarCells = [
    ...Array(new Date(calendarYear, calendarMonthIndex, 1).getDay()).fill(null),
    ...calendarDays,
  ];

  const fiscalWeekPicker = fiscalWeekPickerOpen && pickerPosition && createPortal(
    <div
      role="dialog"
      aria-label="Select a Saturday fiscal week"
      className="fixed z-[10000] overflow-y-auto rounded-lg border p-3 shadow-xl"
      style={{
        backgroundColor: bg,
        borderColor: border,
        top: pickerPosition.top,
        left: pickerPosition.left,
        width: pickerPosition.width,
        maxHeight: pickerPosition.maxHeight,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeCalendarMonth(-1)}
          className="cursor-pointer rounded px-2 py-1 text-sm hover:opacity-60"
          style={{ color: textSec }}
          aria-label="Previous month"
        >
          &#8249;
        </button>
        <span className="text-sm font-semibold" style={{ color: textPri }}>
          {calendarMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => changeCalendarMonth(1)}
          className="cursor-pointer rounded px-2 py-1 text-sm hover:opacity-60"
          style={{ color: textSec }}
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAY_LABELS.map((weekday) => (
          <span key={weekday} className="py-1 font-semibold" style={{ color: textSec }}>
            {weekday}
          </span>
        ))}
        {calendarCells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />;

          const isSaturday = date.getDay() === 6;
          const isSelected = form.fiscal_week === toIsoDate(date);
          return (
            <button
              key={toIsoDate(date)}
              type="button"
              disabled={!isSaturday}
              onClick={() => selectFiscalWeek(date)}
              title={isSaturday ? "Select Saturday" : "Only Saturdays can be selected"}
              className={`rounded py-1.5 transition ${isSaturday ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-30"}`}
              style={{
                backgroundColor: isSelected ? accent : "transparent",
                color: isSelected ? "white" : textPri,
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );

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
                Data Week<span style={{ color: accent }}> *</span>
              </label>
              <input
                type="text"
                value={form.dataweek}
                onChange={set("dataweek")}
                required
                placeholder="e.g. 20"
                disabled={saving}
                style={inputStyle}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-60"
              />
            </div>

            {/* <div>
              <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
                Project<span style={{ color: accent }}> *</span>
              </label>
              <select
                value={form.projectid}
                onChange={set("projectid")}
                required
                disabled={saving || projectsLoading}
                style={inputStyle}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-60"
              >
                <option value="" disabled>
                  {projectsLoading ? "Loading projects..." : "Select project..."}
                </option>
                {projects.map((project) => {
                  const name = project.projName ?? "";
                  const label = name.length > 40 ? `${name.slice(0, 40)}…` : name;
                  return (
                    <option
                      key={project.projectid ?? project.id}
                      value={project.projectid ?? project.id}
                      title={name}
                    >
                      {label}
                    </option>
                  );
                })}
              </select>
            </div> */}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
                Fiscal Week<span style={{ color: accent }}> *</span>
              </label>
              <button
                ref={fiscalWeekButtonRef}
                type="button"
                onClick={openFiscalWeekPicker}
                disabled={saving}
                style={inputStyle}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                aria-haspopup="dialog"
                aria-expanded={fiscalWeekPickerOpen}
              >
                <span className={form.fiscal_week ? "" : "opacity-60"}>
                  {formatFiscalWeek(form.fiscal_week) || "MM/DD/YYYY"}
                </span>
                <span aria-hidden="true">&#128197;</span>
              </button>

            </div>

            {/* <div>
              <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
                Fiscal Date<span style={{ color: accent }}> *</span>
              </label>
              <input
                type="date"
                value={form.fiscal_date}
                onChange={set("fiscal_date")}
                required
                disabled={saving}
                style={inputStyle}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-60"
              />
            </div> */}

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
  return createPortal(<>{modal}{fiscalWeekPicker}</>, document.body);
}
