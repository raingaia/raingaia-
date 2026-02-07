"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GW = process.env.NEXT_PUBLIC_GATEWAY_ORIGIN || "http://localhost:8787";

export default function GatePage() {
  const r = useRouter();
  const [assetId, setAssetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`${GW}/api/gate/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId, apiKey }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      // store token locally for monitor reads (and future ingest auth)
      localStorage.setItem(`nexus_token_${data.idp}`, data.token);

      setLoading(false);
      r.push(`/monitor/${data.idp}`);
      r.refresh();
    } catch (e: any) {
      setLoading(false);
      setErr(e?.message || "Network error");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h1 className="text-2xl font-semibold">NEXUS Gate</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Enter <b>Asset ID</b> and <b>API Key</b> to open a secure monitoring session.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-neutral-300">Asset ID</label>
              <input
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="e.g. 7b1d... (UUID)"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-300">API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="e.g. nx_live_..."
              />
            </div>

            {err && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-white text-black px-4 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Opening..." : "Open Monitoring"}
            </button>

            <p className="text-xs text-neutral-400">
              Gateway: <span className="text-neutral-200">{GW}</span>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
