import { fetchAuthSession } from "aws-amplify/auth";
import { url } from "@/data/constants";
import { initAmplify } from "@/app/components/amplifyConfig";

initAmplify();

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Returns headers that include Authorization: Bearer <id_token>.
 * Pass `extra` to merge additional headers (e.g. Content-Type for JSON bodies).
 * Silently omits the Authorization header if the session can't be read.
 */
export async function getAuthHeaders(extra = {}) {
  let token = null;
  try {
    const session = await fetchAuthSession();
    token = session?.tokens?.idToken?.toString() ?? null;
  } catch {}
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ─── Error parsing ────────────────────────────────────────────────────────────

async function parseError(res) {
  const err = await res.json().catch(() => ({}));
  const msg = Array.isArray(err.detail)
    ? err.detail.map((d) => d.msg).join(", ")
    : err.detail ?? `Error ${res.status}`;
  return new Error(msg);
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function apiGet(path, params = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(url(path, params), { headers });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiPost(path, body) {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const res = await fetch(url(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}


export async function apiPut(path, body) {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const res = await fetch(url(path), {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function apiPatch(path, body) {
  const headers = await getAuthHeaders({ "Content-Type": "application/json" });
  const res = await fetch(url(path), {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(url(path), { method: "DELETE", headers });
  if (!res.ok) throw await parseError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
