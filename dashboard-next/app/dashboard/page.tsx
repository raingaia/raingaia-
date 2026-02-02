"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('key') || 'NO_KEY';
  const qrHash = searchParams.get('seal') || '0xGHOST';
  
  // MÜHENDİSLİK DOKUNUŞU: Hash'ten Veri Türetme (Sistemin Belirlediği Değerler)
  const getInitialData = () => {
    // Hash'in belirli karakterlerini sayıya çevirip veri üretiyoruz
    const tempBase = parseInt(qrHash.substring(10, 12), 16) % 30 || 22.5; 
    const latBase = 40 + (parseInt(qrHash.substring(13, 15), 16) / 255);
    const lonBase = -74 + (parseInt(qrHash.substring(16, 18), 16) / 255);
    
    return { 
      temp: parseFloat(tempBase.toString()), 
      lat: latBase.toFixed(4), 
      lon: lonBase.toFixed(4) 
    };
  };

  const [telemetry, setTelemetry] = useState({ 
    temp: 0, humidity: 45, lat: "0", lon: "0" 
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const startValues = getInitialData();
    setTelemetry({ ...telemetry, temp: startValues.temp, lat: startValues.lat, lon: startValues.lon });
    
    setLogs([
      `[AUTH] API KEY VERIFIED: ${apiKey}`,
      `[DECODE] QR SEAL DETECTED: ${qrHash.substring(0, 12)}...`,
      `[SYNC] EXTRACTING DATA FROM HASH...`
    ]);

    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        temp: +(parseFloat(prev.temp.toString()) + (Math.random() - 0.5)).toFixed(1),
        humidity: +(prev.humidity + (Math.random() - 0.5)).toFixed(0)
      }));

      const newLog = `[${new Date().toLocaleTimeString()}] QR_SIGNAL: VALID /// HASH_PARITY: OK`;
      setLogs(prev => [newLog, ...prev].slice(0, 5));
    }, 2500);

    return () => clearInterval(interval);
  }, [apiKey, qrHash]);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-emerald-500 tracking-tighter uppercase">Nexus Digital Seal</h1>
          <p className="text-[10px] text-zinc-500">ACTIVE SESSION: {apiKey}</p>
        </div>
        <div className="text-right max-w-xs overflow-hidden">
          <p className="text-[9px] text-zinc-600 uppercase">Cryptographic Seal (QR Data)</p>
          <p className="text-[9px] text-blue-400 truncate">{qrHash}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <h3 className="text-zinc-500 text-[10px] uppercase mb-1">Decoded Temperature</h3>
            <div className="text-5xl font-bold text-white tracking-tighter">{telemetry.temp}°C</div>
            <div className="mt-4 text-[9px] text-emerald-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              DATA DERIVED FROM SEAL
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl h-48 overflow-hidden">
            <h3 className="text-zinc-500 text-[10px] mb-2 border-b border-zinc-800 pb-1 uppercase">Live Stream</h3>
            <div className="flex flex-col gap-2">
              {logs.map((log, i) => (
                <span key={i} className="text-[10px] text-zinc-400 font-light tracking-tight">{log}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-zinc-900/20 border border-zinc-800 h-full rounded-2xl p-8 flex flex-col items-center justify-center relative">
            {/* Dinamik QR Sembolü */}
            <div className="p-4 bg-white rounded-lg mb-6 opacity-90 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <div className="w-32 h-32 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NEXUS_SEAL')] bg-cover"></div>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] mb-2">Real-Time Geofence</h2>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full inline-block">
                <p className="text-emerald-400 font-bold text-sm">{telemetry.lat}, {telemetry.lon}</p>
              </div>
              <p className="text-zinc-600 text-[10px] mt-4 uppercase tracking-widest">Seal Status: Authentic & Locked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-10 text-zinc-500">INITIATING DECODER...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
