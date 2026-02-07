import Fastify from "fastify";
import cors from "@fastify/cors";
import { createHash } from "crypto";

const app = Fastify({ logger: true });

// In-memory Store (Şimdilik her şey burada)
const lastByIdp = new Map<string, any>();

// IDP oluşturucu (Stabil kalsın diye dokunmadık)
function deriveIdp(assetId: string, apiKey: string) {
  return createHash("sha256").update(`${assetId}|${apiKey}`).digest("hex").slice(0, 24);
}

app.register(cors, { origin: true });

// 1) Login: Sadece IDP döndürür (Giriş simülasyonu)
app.post("/api/gate/login", async (req, reply) => {
  const { assetId, apiKey } = (req.body ?? {}) as any;

  if (!assetId) return reply.code(400).send({ error: "assetId eksik" });

  const idp = deriveIdp(assetId, apiKey || "default-key");
  
  return { ok: true, idp };
});

// 2) Ingest: Cihazdan veya Edge'den gelen veriyi kaydet
app.post("/api/edge/ingest", async (req, reply) => {
  const body = (req.body ?? {}) as any;
  const idp = body.idp;

  if (!idp) return reply.code(400).send({ error: "idp parametresi şart" });

  const item = {
    idp,
    kid: body.kid || "unknown",
    ts: Date.now(),
    payload: body.payload || body // Eğer payload gelmezse tüm body'i kaydet
  };

  lastByIdp.set(idp, item);
  
  return { ok: true, saved_ts: item.ts };
});

// 3) Monitor: Kaydedilen son veriyi izle
app.get("/api/edge/last/:idp", async (req, reply) => {
  const { idp } = req.params as any;
  const item = lastByIdp.get(idp);

  return { 
    ok: true, 
    idp,
    item: item ?? { msg: "Bu IDP için henüz veri gelmedi" } 
  };
});

// 4) Debug: Tüm sistemi gör (Geliştirme için ekledim)
app.get("/api/debug/all", async () => {
  return Object.fromEntries(lastByIdp);
});

const PORT = Number(process.env.PORT ?? 8787);
app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`✅ Sistem hazır: http://localhost:${PORT}`);
});