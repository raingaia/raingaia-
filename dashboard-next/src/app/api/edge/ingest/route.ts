import { NextResponse } from "next/server";

type IngestBody = {
  kid?: string;            // API key id (client / provision tarafından verilecek)
  idp?: string;            // identity proof id (QR türevi / cihaz kimliği)
  ts?: number;             // timestamp (ms). yoksa server koyar
  telemetry?: any;         // { lat, lon, temp, ... }
  seal?: any;              // oracle çıktısı (proof / seal / verdict)
  status?: string;         // "ok" | "alert" | "invalid" ...
  payload?: any;           // ek ham data
};

type Snapshot = {
  kid: string;
  idp: string;
  ts: number;
  telemetry: any;
  seal: any;
  status: string;
  payload: any;
};

const g: any = globalThis as any;

// kid -> latest snapshot
g.__edgeLatestByKid ||= new Map<string, Snapshot>();
// idp -> latest snapshot
g.__edgeLatestByIdp ||= new Map<string, Snapshot>();
// kid -> ring buffer (son N kayıt)
g.__edgeRing ||= new Map<string, Snapshot[]>();

const RING_MAX = 50;

function asStr(x: any) {
  return String(x ?? "").trim();
}

export async function POST(req: Request) {
  const body: IngestBody = await req.json().catch(() => ({}));

  const kid = asStr(body.kid);
  const idp = asStr(body.idp);

  if (!kid || !idp) {
    return NextResponse.json(
      { ok: false, error: "kid & idp required" },
      { status: 400 }
    );
  }

  const snap: Snapshot = {
    kid,
    idp,
    ts: Number.isFinite(Number(body.ts)) ? Number(body.ts) : Date.now(),
    telemetry: body.telemetry ?? null,
    seal: body.seal ?? null,
    status: asStr(body.status) || "ok",
    payload: body.payload ?? null,
  };

  // latest
  g.__edgeLatestByKid.set(kid, snap);
  g.__edgeLatestByIdp.set(idp, snap);

  // ring
  const ring = g.__edgeRing.get(kid) ?? [];
  ring.push(snap);
  while (ring.length > RING_MAX) ring.shift();
  g.__edgeRing.set(kid, ring);

  return NextResponse.json({ ok: true, ts: snap.ts });
}

// Debug için GET (istersen sonra kapatırız)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kid = asStr(url.searchParams.get("kid"));
  const idp = asStr(url.searchParams.get("idp"));

  if (kid) {
    const latest = g.__edgeLatestByKid.get(kid) ?? null;
    const ring = g.__edgeRing.get(kid) ?? [];
    return NextResponse.json({ ok: true, kid, latest, ring });
  }

  if (idp) {
    const latest = g.__edgeLatestByIdp.get(idp) ?? null;
    return NextResponse.json({ ok: true, idp, latest });
  }

  return NextResponse.json({
    ok: true,
    hint: "Use ?kid=... or ?idp=...",
  });
}