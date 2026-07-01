"use client";

/**
 * Generic filter bar.
 * dropdowns: Array<{ allLabel: string, value: string, options: string[], onChange: fn }>
 */
export function FilterBar({
  searchQuery,
  searchPlaceholder = "Search…",
  dropdowns = [],
  hasFilters,
  onSearchChange,
  onClearFilters,
  theme,
}) {
  const { bg, bgSub, border, textPri, textSec, accent } = theme;

  const selProps = {
    style: { backgroundColor: bgSub, borderColor: border, color: textPri },
    className:
      "rounded-lg border px-3 py-2.5 text-sm outline-none appearance-none cursor-pointer transition",
    onFocus: (e) => (e.currentTarget.style.borderColor = accent),
    onBlur:  (e) => (e.currentTarget.style.borderColor = border),
  };

  return (
    <div
      style={{ backgroundColor: bg, borderColor: border }}
      className="rounded-xl border px-4 py-4 flex flex-wrap items-center gap-3 flex-shrink-0"
    >
      {/* Search input */}
      <div className="relative flex-1 min-w-[220px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: textSec }}
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          style={{ backgroundColor: bgSub, borderColor: border, color: textPri }}
          className="w-full rounded-lg border pl-9 pr-8 py-2.5 text-sm outline-none transition"
          onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
          onBlur={(e)  => (e.currentTarget.style.borderColor = border)}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange({ target: { value: "" } })}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60 transition"
            style={{ color: textSec }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dynamic dropdowns */}
      {dropdowns.map((dd, i) => (
        <select key={i} value={dd.value} onChange={dd.onChange} {...selProps}>
          <option value="">{dd.allLabel}</option>
          {dd.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ))}

      {hasFilters && (
        <button
          onClick={onClearFilters}
          style={{ color: accent, borderColor: border }}
          className="px-4 py-2.5 rounded-lg border text-sm font-medium hover:opacity-70 transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
