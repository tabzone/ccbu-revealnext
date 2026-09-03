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
