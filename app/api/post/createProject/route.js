import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const auth = req.headers.get("authorization") || "";

    // Try to forward to backend if configured, otherwise return mock
    const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    if (base) {
      try {
        const res = await fetch(`${base}/createproject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth ? { Authorization: auth } : {}),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return NextResponse.json(data, { status: 200 });
        return NextResponse.json(data || { message: "Failed to create project" }, { status: res.status });
      } catch (e) {
        console.error("Proxy to backend failed, returning mock:", e);
      }
    }

    // Fallback mock — keeps pasted flow working without backend
    const mockId = `proj_${Date.now()}`;
    return NextResponse.json({ projectid: mockId, ...body }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message || "Invalid request" }, { status: 400 });
  }
}
