"use client";

import { useEffect, useState } from "react";
import { PRODUCT_EMPTY_FORM, PRODUCT_FIELDS } from "@/data/productConstants";
import { apiPost } from "@/lib/api";

export function ProductModal({ product, onClose, onSaved, theme }) {
  const isEdit = !!product;
  const { bg, bgSub, border, textPri, textSec, accent } = theme;

  const [form, setForm]     = useState(isEdit ? { ...product } : { ...PRODUCT_EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { ...form };
      Object.keys(body).forEach((k) => { if (body[k] === "") body[k] = null; });
      if (isEdit) delete body.upc;

      const result = isEdit
        ? await apiPost(`/updateproduct/${product.upc}`, body)
        : await apiPost("/products", body);

      onSaved(result);
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

  const fieldByKey = Object.fromEntries(PRODUCT_FIELDS.map((f) => [f.key, f]));

  const renderField = (fieldKey, fullWidth = false) => {
    const field = fieldByKey[fieldKey];
    if (!field) return null;
    return (
      <div key={field.key} className={fullWidth ? "md:col-span-2" : ""}>
        <label className="mb-2 block text-xs font-semibold uppercase" style={{ color: textSec }}>
          {field.label}
          {field.required && <span style={{ color: accent }}> *</span>}
        </label>
        <input
          type="text"
          value={form[field.key] ?? ""}
          onChange={set(field.key)}
          required={field.required}
          disabled={isEdit && field.key === "upc"}
          style={inputStyle}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-50"
        />
      </div>
    );
  };

  const renderSection = (title, children) => (
    <section key={title}>
      <div className="mb-4 border-b pb-2" style={{ borderColor: border }}>
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSec }}>{title}</h3>
      </div>
      {children}
    </section>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[90dvh] max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-5" style={{ borderColor: border }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold" style={{ color: textPri }}>
                {isEdit ? `Edit Product — ${product.upc}` : "Create Product"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: textSec }}>
                {PRODUCT_FIELDS.length} fields
              </p>
            </div>
            <button type="button" onClick={onClose} className="cursor-pointer ml-4 shrink-0 text-2xl leading-none hover:opacity-60 transition" style={{ color: textSec }} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-6">
              {renderSection("Product Identity",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {renderField("upc")}
                  {renderField("item_desc")}
                  {renderField("brand")}
                  {renderField("trademark")}
                  {renderField("sub_brand")}
                  {renderField("manufacturer")}
                </div>
              )}

              {renderSection("Category & Classification",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {renderField("category")}
                  {renderField("category_desc")}
                  {renderField("sub_category_desc")}
                  {renderField("segment")}
                  {renderField("product_class")}
                </div>
              )}

              {renderSection("Details",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {renderField("size_desc")}
                  {renderField("pack_size")}
                  {renderField("caloric")}
                  {renderField("consumption")}
                  {renderField("system")}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4" style={{ borderColor: border }}>
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border px-5 py-2 text-sm font-medium" style={{ borderColor: border, color: textSec }}>
              Cancel
            </button>
            <button
              disabled={saving}
              type="submit"
              className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-70"
              style={{ backgroundColor: accent }}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
