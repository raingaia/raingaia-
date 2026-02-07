import { NextResponse } from "next/server";

const g: any = globalThis as any;
g.__lastByIdp ||= new Map<string, any>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idp = String(searchParams.get("idp") || "").trim();
  if (!idp) return NextResponse.json({ error: "idp required" }, { status: 400 });

  const item = g.__lastByIdp.get(idp) || null;
  return NextResponse.json({ ok: true, item });
}
