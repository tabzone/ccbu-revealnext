import { url } from "@/data/constants";

async function parseError(res) {
  const err = await res.json().catch(() => ({}));
  const msg = Array.isArray(err.detail)
    ? err.detail.map((d) => d.msg).join(", ")
    : err.detail ?? `Error ${res.status}`;
  return new Error(msg);
}

export async function apiGet(path, params = {}) {
  const res = await fetch(url(path, params));
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(url(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function apiPatch(path, body) {
  const res = await fetch(url(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function apiDelete(path) {
  const res = await fetch(url(path), { method: "DELETE" });
  if (!res.ok) throw await parseError(res);
}
