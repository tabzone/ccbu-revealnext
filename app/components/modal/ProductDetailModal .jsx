"use client";

function Row({ label, value, textSec, textPri }) {
  return (
    <div className="flex items-start justify-between py-2.5 gap-4">
      <span style={{ color: textSec }} className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap pt-0.5">
        {label}
      </span>
      <span style={{ color: textPri }} className="text-sm font-medium text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

function Section({ title, textSec, border, children }) {
  return (
    <section>
      <div className="mb-1 border-b pb-2" style={{ borderColor: border }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSec }}>{title}</h3>
      </div>
      <div className="divide-y" style={{ borderColor: border }}>
        {children}
      </div>
    </section>
  );
}

export function ProductDetailModal({ product, theme, onClose, onEdit }) {
  if (!product) return null;

  const { bg, bgSub, border, textPri, textSec, accent } = theme;
  const isDark = theme.accent === "#f87171";

  const row = (label, key) => (
    <Row key={key} label={label} value={product[key]} textSec={textSec} textPri={textPri} />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[90dvh] max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-5" style={{ borderColor: border }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p style={{ color: textSec }} className="text-xs font-semibold uppercase tracking-wide">Product Detail</p>
              <h2 className="text-xl font-semibold truncate" style={{ color: textPri }}>
                {product.item_desc ?? "—"}
              </h2>
              <p style={{ color: accent }} className="mt-1 text-sm font-bold">{product.upc}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer ml-4 shrink-0 text-2xl leading-none hover:opacity-60 transition"
              style={{ color: textSec }}
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <Section title="Product Identity" textSec={textSec} border={border}>
              {row("UPC", "upc")}
              {row("Item Description", "item_desc")}
              {row("Brand", "brand")}
              {row("Trademark", "trademark")}
              {row("Sub-Brand", "sub_brand")}
              {row("Manufacturer", "manufacturer")}
            </Section>

            <Section title="Category & Classification" textSec={textSec} border={border}>
              <Row
                label="Category"
                textSec={textSec}
                textPri={textPri}
                value={
                  product.category ? (
                    <span
                      style={{
                        backgroundColor: isDark ? "#1e2d45" : "#eff6ff",
                        color: isDark ? "#93c5fd" : "#1d4ed8",
                      }}
                      className="inline-flex px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap"
                    >
                      {product.category}
                    </span>
                  ) : null
                }
              />
              {row("Category Description", "category_desc")}
              {row("Sub-Category", "sub_category_desc")}
              {row("Segment", "segment")}
              {row("Product Class", "product_class")}
            </Section>

            <Section title="Details" textSec={textSec} border={border}>
              {row("Size", "size_desc")}
              {row("Pack Size", "pack_size")}
              {row("Caloric", "caloric")}
              {row("Consumption", "consumption")}
              {row("System", "system")}
              <Row
                label="Status"
                textSec={textSec}
                textPri={textPri}
                value={
                  <span
                    style={
                      product.status === "Archived"
                        ? { backgroundColor: bgSub, color: textSec }
                        : { backgroundColor: isDark ? "#14532d" : "#dcfce7", color: isDark ? "#86efac" : "#15803d" }
                    }
                    className="inline-flex px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  >
                    {product.status ?? "—"}
                  </span>
                }
              />
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4" style={{ borderColor: border }}>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border px-5 py-2 text-sm font-medium"
            style={{ borderColor: border, color: textSec }}
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => { onEdit(product); onClose(); }}
              className="cursor-pointer rounded-lg px-5 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}