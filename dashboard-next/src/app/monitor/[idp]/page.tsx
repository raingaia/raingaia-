"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const GW = process.env.NEXT_PUBLIC_GATEWAY_ORIGIN || "http://localhost:8787";

type Item = {
  idp: string;
  kid: string;
  ts: number;
  payload: any;
};

export default function MonitorPage() {
  const params = useParams();
  const idp = String(params?.idp ?? "");
  const tokenKey = useMemo(() => `nexus_token_${idp}`, [idp]);

  const [item, setItem] = useState<Item | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const token = localStorage.getItem(tokenKey) || "";
        const res = await fetch(`${GW}/api/edge/last/${idp}`, {
          headers: token ? { "x-nexus-token": token } : undefined,
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Fetch failed");

        if (!alive) return;
        setItem(data.item ?? null);
        setErr(null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Network error");
      }
    }

    tick();
    const t = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [idp, tokenKey]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Live Monitor</h1>
          <div className="text-sm text-neutral-300">
            IDP: <span className="text-neutral-100 font-mono">{idp}</span>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-neutral-400">Last KID</div>
            <div className="mt-2 font-mono text-sm break-all">{item?.kid ?? "—"}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-neutral-400">Last Timestamp</div>
            <div className="mt-2 text-sm">
              {item?.ts ? new Date(item.ts).toLocaleString() : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-neutral-400">Status</div>
            <div className="mt-2 text-sm">
              {item ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  LIVE
                </span>
              ) : (
                <span className="text-neutral-400">Waiting for first seal…</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Last Payload</div>
          <pre className="mt-3 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-neutral-200">
{JSON.stringify(item?.payload ?? null, null, 2)}
          </pre>
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          Polling: 1s • Gateway: {GW}
        </div>
      </div>
    </main>
  );
}
