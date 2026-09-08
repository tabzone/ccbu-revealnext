export default function formatDate(value, withTime = false) {
    if (value === null || value === undefined || value === "") return "-";

    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();

    const date = `${month}/${day}/${year}`;

    if (!withTime) return date;

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${date} ${hours}:${minutes}:${seconds}`;
}


export function formatDateLocale(utcDate) {
  if (!utcDate) return "";

  return new Date(utcDate).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // local AM/PM
  });
}


export function formatDateTime(isoDate) {
  if (!isoDate) return "";

  const date = new Date(isoDate);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
}



export const formatFileSize = (size) => {
  if (size < 1024) return `${size} Bytes`;
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};



export const noSpaceInput = (value = "") => {
  const NO_SPACES_REGEX = /^\S*$/;
  return NO_SPACES_REGEX.test(value);
};