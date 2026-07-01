const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
export const PAGE_SIZE = 20;

export function url(path, params = {}) {
  const u = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) u.searchParams.set(k, v);
  });
  return u.toString();
}

export const FIELDS = [
  { key: "store",           label: "Store #",          type: "number", required: true },
  { key: "region",          label: "Region" },
  { key: "district",        label: "District" },
  { key: "store_leader",    label: "Store Leader" },
  { key: "address",         label: "Address" },
  { key: "city",            label: "City" },
  { key: "state",           label: "State (e.g. GA)" },
  { key: "county",          label: "County" },
  { key: "zip_code",        label: "ZIP Code" },
  { key: "phone",           label: "Phone" },
  { key: "fax",             label: "Fax" },
  { key: "opened",          label: "Date Opened",      type: "date" },
  { key: "kitchen",         label: "Kitchen" },
  { key: "kitchen_manager", label: "Kitchen Manager" },
  { key: "comp_store",      label: "Comp Store" },
  { key: "bottler",         label: "Bottler" },
  { key: "same_store_sales",label: "Same Store Sales" },
];

export const EMPTY_FORM = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));