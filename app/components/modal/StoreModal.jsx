"use client";

import { useEffect, useState } from "react";
import { EMPTY_FORM, FIELDS } from "@/data/constants";
import { apiPost, apiPatch } from "@/lib/api";

export function StoreModal({ store, onClose, onSaved, theme }) {
  const isEdit = !!store;
  const { bg, bgSub, border, textPri, textSec, accent } = theme;

  const [form, setForm] = useState(
    isEdit
      ? { ...store, opened: store.opened ?? "" }
      : { ...EMPTY_FORM }
  );

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
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = { ...form };

      Object.keys(body).forEach((k) => {
        if (body[k] === "") body[k] = null;
      });

      if (body.store !== null) {
        body.store = parseInt(body.store, 10);
      }

      

      if (isEdit) delete body.store;

      const savedStore = isEdit
        ? await apiPost(`/stores/${store.store}`, body)
        : await apiPost("/stores", body);

      onSaved(savedStore);
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

  const fieldByKey = Object.fromEntries(FIELDS.map((field) => [field.key, field]));

  const renderField = (fieldKey, fullWidth = false) => {
    const field = fieldByKey[fieldKey];
    if (!field) return null;

    return (
      <div key={field.key} className={fullWidth ? "md:col-span-2" : ""}>
        <label
          className="mb-2 block text-xs font-semibold uppercase"
          style={{ color: textSec }}
        >
          {field.label}
          {field.required && <span style={{ color: accent }}> *</span>}
        </label>
        <input
          type={field.type ?? "text"}
          value={form[field.key] ?? ""}
          onChange={set(field.key)}
          required={field.required}
          disabled={isEdit && field.key === "store"}
          style={inputStyle}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition disabled:opacity-50"
        />
      </div>
    );
  };

  const renderSection = (title, children) => (
    <section key={title}>
      <div className="mb-4 border-b pb-2" style={{ borderColor: border }}>
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: textSec }}
        >
          {title}
        </h3>
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
        className="flex h-[90dvh] max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        style={{
          backgroundColor: bg,
          borderColor: border,
        }}
      >
        <div
          className="shrink-0 border-b px-6 py-5"
          style={{ borderColor: border }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold" style={{ color: textPri }}>
                {isEdit ? `Edit Store #${store.store}` : "Create Store"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: textSec }}>
                {FIELDS.length} fields to complete
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 shrink-0 text-2xl leading-none transition hover:opacity-60"
              style={{ color: textSec }}
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {renderSection(
                "Store Information",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {renderField("store")}
                  {renderField("region")}
                  {renderField("district")}
                  {renderField("store_leader")}
                </div>
              )}

              {renderSection(
                "Location",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {renderField("address", true)}
                  {renderField("city")}
                  {renderField("state")}
                  {renderField("county")}
                  {renderField("zip_code")}
                </div>
              )}

              {renderSection(
                "Contact",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {renderField("phone")}
                  {renderField("fax")}
                </div>
              )}

              {renderSection(
                "Operations",
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
                  {renderField("opened")}
                  {renderField("kitchen")}
                  {renderField("kitchen_manager")}
                  {renderField("comp_store")}
                  {renderField("bottler")}
                  {renderField("same_store_sales")}
                </div>
              )}
            </div>
          </div>

          <div
            className="flex shrink-0 justify-end gap-3 border-t px-6 py-4"
            style={{ borderColor: border }}
          >
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-2 text-sm font-medium"
              style={{ borderColor: border, color: textSec }}
            >
              Cancel
            </button>

            <button
              disabled={saving}
              type="submit"
              className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-70"
              style={{ backgroundColor: accent }}
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
