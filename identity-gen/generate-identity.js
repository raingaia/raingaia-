const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const sha256 = (s) =>
  crypto.createHash("sha256").update(s).digest("hex");

const nowISO = () => new Date().toISOString();

// GERÇEK asset id (zaman + random)
const asset_id =
  "MED_" +
  Date.now().toString(36).toUpperCase() +
  "_" +
  crypto.randomBytes(4).toString("hex").toUpperCase();

// GERÇEK QR referansı
const qr_ref =
  "QR_" + crypto.randomBytes(12).toString("hex").toUpperCase();

// QR hash (oracle bunu TÜRETİYOR, dışarıdan simüle değil)
const qr_code_hash = sha256("QR|" + qr_ref);

const identity = {
  version: "nexus-identity-v1",
  ts: nowISO(),
  asset_id,
  asset_type: "MEDICAL_SUPPLY",
  origin: "NJ_WAREHOUSE_01",
  qr_ref,
  qr_code_hash,
  status: "INITIALIZED"
};

const outPath = path.join(
  __dirname,
  "..",
  "data",
  "identity.latest.public.json"
);

fs.writeFileSync(outPath, JSON.stringify(identity, null, 2));

console.log("[IDENTITY] generated");
console.log(" asset_id:", asset_id);
console.log(" qr_ref:", qr_ref);
console.log(" qr_code_hash:", qr_code_hash.slice(0, 16) + "…");
