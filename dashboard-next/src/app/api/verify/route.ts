import { NextRequest, NextResponse } from "next/server";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

// ✅ GET: dashboard polling buraya düşüyor
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kid = searchParams.get("kid") || "";
  const idp = searchParams.get("idp") || "";

  if (!kid || !idp) {
    return json({ ok: false, error: "kid and idp required" }, 400);
  }

  return json({
    ok: true,
    verdict: "OK",
    kid,
    idp,
    ts: Date.now(),
  });
}

// ✅ POST: manuel verify / edge / oracle için
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kid = String(body.kid || "");
  const idp = String(body.idp || "");

  if (!kid || !idp) {
    return json({ ok: false, error: "kid and idp required" }, 400);
  }

  return json({
    ok: true,
    verdict: "OK",
    kid,
    idp,
    ts: Date.now(),
  });
}
