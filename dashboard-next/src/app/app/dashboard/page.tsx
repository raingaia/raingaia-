"use client";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

type VerifyOk = { ok: true; item: any };
type VerifyErr = { ok: false; error?: string };
type VerifyRes = VerifyOk | VerifyErr;

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState(""); // v1: UI alanı
  const [qrSeed, setQrSeed] = useState("");
  const [kid, setKid] = useState("demo_kid_1");
  const [idp, setIdp] = useState("demo_idp_1");
  const [last, setLast] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Doğru endpoint: /api/provision (eğer sende varsa)
  // Eğer provision henüz yoksa, bu butonu şimdilik kullanmayacağız.
  async function provision() {
    setErr(null);
    setKid("");
    setIdp("");
    setLast(null);

    const res = await fetch("/api/provision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qrSeed }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data?.error || "provision failed");
      return;
    }

    setKid(data.kid || "");
    setIdp(data.idp || "");
  }

  const verifyUrl = useMemo(() => {
    const qs = new URLSearchParams({
      kid: kid || "",
      idp: idp || "",
    });
    return `/api/verify?${qs.toString()}`;
  }, [kid, idp]);

  // ✅ Live poll: /api/verify (çalışan hat)
  useEffect(() => {
    if (!kid || !idp) return;

    let stop = false;

    async function tick() {
      try {
        const r = await fetch(verifyUrl, { method: "GET" });
        const d = (await r.json().catch(() => ({}))) as VerifyRes;

        if (stop) return;

        if (!r.ok || !("ok" in d) || (d as any).ok === false) {
          setErr((d as any)?.error || `HTTP ${r.status}`);
          setLast(null);
          return;
        }

        setErr(null);
        setLast((d as VerifyOk).item ?? null);
      } catch (e: any) {
        if (stop) return;
        setErr(e?.message || "fetch failed");
        setLast(null);
      }
    }

    tick();
    const t = setInterval(tick, 1200);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [kid, idp, verifyUrl]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
        Operational Dashboard
      </h1>
      <p style={{ opacity: 0.75, marginBottom: 16 }}>
        No QR scan. QR seed generates IDp. Remote device sends telemetry using IDp; dashboard shows live data.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "white",
            border: "1px solid #dbeafe",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Provision</div>

          <label style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
            API Key (dashboard access)
          </label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="(v1: UI only)"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 10,
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginTop: 12,
              marginBottom: 6,
            }}
          >
            QR Seed (passive identity)
          </label>
          <textarea
            value={qrSeed}
            onChange={(e) => setQrSeed(e.target.value)}
            placeholder='e.g. {"batch":"A1","asset":"PKG-7788","salt":"..."}'
            style={{
              width: "100%",
              height: 110,
              padding: 10,
              border: "1px solid #cbd5e1",
              borderRadius: 10,
            }}
          />

          <button
            onClick={provision}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #1d4ed8",
              background: "#2563eb",
              color: "white",
              fontWeight: 800,
            }}
          >
            Generate IDp (no-scan)
          </button>

          <div style={{ marginTop: 12, fontSize: 13 }}>
            <div>
              KID:{" "}
              <input
                value={kid}
                onChange={(e) => setKid(e.target.value)}
                placeholder="demo_kid_1"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 10,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                }}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              IDp:{" "}
              <input
                value={idp}
                onChange={(e) => setIdp(e.target.value)}
                placeholder="demo_idp_1"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 10,
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Verify URL: <code>{verifyUrl}</code>
          </div>

          {err ? (
            <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 700 }}>
              {err}
            </div>
          ) : null}
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #dbeafe",
            borderRadius: 14,
            padding: 14,
            minHeight: 260,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 800 }}>Live Telemetry</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {kid && idp ? "polling..." : "enter kid/idp"}
            </div>
          </div>

          <pre
            style={{
              marginTop: 12,
              padding: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "auto",
            }}
          >
{JSON.stringify(last, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
