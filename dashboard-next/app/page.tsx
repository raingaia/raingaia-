"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [status, setStatus] = useState("IDLE");
  const [apiKey, setApiKey] = useState("");
  const router = useRouter();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (apiKey.length < 3) return;

    setStatus("LOADING");
    
    setTimeout(() => {
      setStatus("SUCCESS");
      // KRİTİK GÜNCELLEME: Key'i URL parametresine ekleyerek gönderiyoruz
      setTimeout(() => {
        router.push(`/dashboard?key=${apiKey}`);
      }, 500);
    }, 800); 
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 font-mono selection:bg-emerald-500/30">
      
      <div className="fixed top-0 w-full flex justify-between px-8 py-6 border-b border-zinc-900 bg-black/80 backdrop-blur-md z-20">
        <p className="text-xs text-zinc-500 tracking-[0.3em]">SECURE GATEWAY v1.0</p>
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${status === "IDLE" ? "bg-red-500" : "bg-emerald-500"} animate-pulse`}></div>
           <span className="text-xs text-zinc-500">{status === "IDLE" ? "LOCKED" : "SYSTEM ACTIVE"}</span>
        </div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-900/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-900/20 rounded-full blur-[80px]"></div>

        <div className="relative bg-zinc-900/30 border border-zinc-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 mb-2">
              NEXUS ACCESS
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">
              Identity Verification Required
            </p>
          </div>

          <div className={`h-16 flex items-center justify-center border rounded-lg mb-8 transition-all duration-500 ${
            status === "IDLE" ? "border-zinc-800 bg-black/50" :
            status === "LOADING" ? "border-blue-900/50 bg-blue-900/10" :
            "border-emerald-500/50 bg-emerald-900/10"
          }`}>
             {status === "IDLE" && <span className="text-zinc-600 text-xs animate-pulse tracking-widest">ENTER SECURE KEY</span>}
             {status === "LOADING" && <span className="text-blue-400 text-xs animate-pulse tracking-widest">AUTHENTICATING...</span>}
             {status === "SUCCESS" && <span className="text-emerald-400 text-sm font-bold tracking-widest">ACCESS GRANTED</span>}
          </div>

          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] text-zinc-600 ml-1 mb-1 block group-focus-within:text-emerald-500 transition-colors">API SECURITY KEY</label>
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
                placeholder="XXXX-XXXX-XXXX"
                className="w-full bg-black/50 border border-zinc-800 text-center text-emerald-500 text-lg tracking-[0.2em] p-4 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-900 transition-all placeholder:text-zinc-800"
              />
            </div>

            <button 
              onClick={() => handleLogin()}
              disabled={status !== "IDLE"}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-white/10"
            >
              {status === "LOADING" ? "PROCESSING..." : "INITIALIZE SESSION"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
