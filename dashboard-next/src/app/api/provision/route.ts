import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const g: any = globalThis as any;
g.__PROOF_KEYS__ ||= new Map<string, { apiKey: string; ts: number }>();

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

function makeApiKey() {
  // demo için benzersiz yeterli
  return `rk_${Date.now().toString(36)}_${randInt(1e9).toString(36)}`;
}

export async function POST() {
  const kid = `demo_kid_${randInt(10000)}`;
  const idp = `demo_idp_${randInt(10000)}`;
  const apiKey = makeApiKey();

  g.__PROOF_KEYS__.set(`${kid}::${idp}`, { apiKey, ts: Date.now() });

  return NextResponse.json({ ok: true, kid, idp, apiKey, ts: Date.now() });
}
