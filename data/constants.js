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


export const StoreIcon = ({ color }) => {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PlanogramIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export const CARDS = [
  {
    key: "stores",
    filetype: "STR",
    title: "Stores Upload",
    description: "Upload master stores data (CSV or Excel)",
    uploadPath: "/stores/upload",
    downloadPath: "/Stores_template.xlsx",
    downloadLabel: "Stores Template",
    historyPath: "/stores/uploads",
    Icon: StoreIcon,
  },
  {
    key: "planograms",
    filetype: "POG",
    title: "Planogram Upload",
    description: "Upload planogram master data (CSV or Excel)",
    uploadPath: "/planograms/upload",
    downloadPath: "/Planogram_template.xlsx",
    downloadLabel: "Planogram Template",
    historyPath: "/planograms/uploads",
    Icon: PlanogramIcon,
  },
];