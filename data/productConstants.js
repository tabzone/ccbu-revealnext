export const PRODUCT_FIELDS = [
  { key: "upc",               label: "UPC",                required: true },
  { key: "item_desc",         label: "Item Description" },
  { key: "brand",             label: "Brand" },
  { key: "manufacturer",      label: "Manufacturer" },
  { key: "trademark",         label: "Trademark" },
  { key: "sub_brand",         label: "Sub-Brand" },
  { key: "category",          label: "Category" },
  { key: "category_desc",     label: "Category Description" },
  { key: "sub_category_desc", label: "Sub-Category" },
  { key: "segment",           label: "Segment" },
  { key: "product_class",     label: "Product Class" },
  { key: "size_desc",         label: "Size" },
  { key: "pack_size",         label: "Pack Size" },
  { key: "caloric",           label: "Caloric" },
  { key: "consumption",       label: "Consumption" },
  { key: "system",            label: "System" },
];

export const PRODUCT_EMPTY_FORM = Object.fromEntries(
  PRODUCT_FIELDS.map((f) => [f.key, ""])
);
