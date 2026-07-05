"use client";

import { CARDS } from "@/data/constants";
import { UploadTab } from "./UploadTab";

// function StoreIcon({ color }) {
//   return (
//     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
//       <polyline points="9 22 9 12 15 12 15 22" />
//     </svg>
//   );
// }

// function PlanogramIcon({ color }) {
//   return (
//     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="3" y="3" width="7" height="7" rx="1" />
//       <rect x="14" y="3" width="7" height="7" rx="1" />
//       <rect x="3" y="14" width="7" height="7" rx="1" />
//       <rect x="14" y="14" width="7" height="7" rx="1" />
//     </svg>
//   );
// }

// const CARDS = [
//   {
//     key: "stores",
//     title: "Stores Upload",
//     description: "Upload master stores data (CSV or Excel)",
//     uploadPath: "/stores/upload",
//     downloadPath: "/stores/template",
//     downloadLabel: "Stores Template",
//     historyPath: "/stores/uploads",
//     Icon: StoreIcon,
//   },
//   {
//     key: "planograms",
//     title: "Planogram Upload",
//     description: "Upload planogram master data (CSV or Excel)",
//     uploadPath: "/planograms/upload",
//     downloadPath: "/planograms/template",
//     downloadLabel: "Planogram Template",
//     historyPath: "/planograms/uploads",
//     Icon: PlanogramIcon,
//   },
// ];

export function UploadStoresTab({ theme, addToast }) {
  return <UploadTab cards={CARDS} theme={theme} addToast={addToast} />;
}
