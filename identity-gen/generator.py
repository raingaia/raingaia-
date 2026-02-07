# identity-gen/generator.py
import os, json, time, uuid, hmac, hashlib, secrets
from datetime import datetime, timezone

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT, "data")
SECRETS_DIR = os.path.join(ROOT, ".secrets")
MASTER_SEED_PATH = os.path.join(SECRETS_DIR, "master_seed.txt")

def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def _b32(x: bytes) -> str:
    import base64
    return base64.b32encode(x).decode("utf-8").replace("=", "").lower()

def _b64url(x: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(x).decode("utf-8").replace("=", "")

def ensure_master_seed():
    os.makedirs(SECRETS_DIR, exist_ok=True)
    if os.path.exists(MASTER_SEED_PATH):
        with open(MASTER_SEED_PATH, "r", encoding="utf-8") as f:
            seed = f.read().strip()
            if len(seed) < 64:
                raise RuntimeError("master_seed.txt too short. Use >= 64 chars.")
            return seed.encode("utf-8")

    # first boot: generate seed
    seed = _b64url(secrets.token_bytes(64))
    with open(MASTER_SEED_PATH, "w", encoding="utf-8") as f:
        f.write(seed)
    return seed.encode("utf-8")

def hmac_sha256(key: bytes, msg: str) -> str:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).hexdigest()

def sha256_hex(msg: str) -> str:
    return hashlib.sha256(msg.encode("utf-8")).hexdigest()

def write_json(path: str, obj: dict):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)

def append_audit(event: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    audit_path = os.path.join(DATA_DIR, "audit.ndjson")
    with open(audit_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(event) + "\n")

def create_asset_identity(asset_type: str, origin: str):
    master = ensure_master_seed()

    ts = _now_iso()
    nonce = _b64url(secrets.token_bytes(16))
    asset_id = f"asset_{uuid.uuid4()}"

    # ✅ API KEY (self-born)
    api_key = "nxs_" + _b64url(secrets.token_bytes(32))  # secret (never stored plaintext)

    # ✅ KID = public id derived from api_key (cannot recover api_key)
    kid = "kid_" + _b32(hashlib.sha256(api_key.encode("utf-8")).digest())[:16]

    # ✅ QR reference = public ref (no info)
    qr_ref_seed = f"{kid}|{ts}|{nonce}|{asset_type}|{origin}"
    qr_ref = "qr_" + _b32(hashlib.sha256(qr_ref_seed.encode("utf-8")).digest())[:20]

    # ✅ Pair commit = ties kid+qr_ref+asset meta (public, tamper-evident)
    pair_commit = sha256_hex(f"PAIR|{kid}|{qr_ref}|{asset_type}|{origin}|{ts}")

    # ✅ Store ONLY hashed secret for server-side verification
    # api_secret_hash: used later to verify presented api_key belongs to this kid
    api_secret_hash = hmac_sha256(master, api_key)

    public_doc = {
        "version": "nexus-identity-v1",
        "ts": ts,
        "asset_id": asset_id,
        "asset_type": asset_type,
        "origin": origin,
        "kid": kid,
        "qr_ref": qr_ref,
        "pair_commit": pair_commit,
        "status": "INITIALIZED"
    }

    # private doc: NO plaintext api_key
    private_doc = {
        "version": "nexus-identity-private-v1",
        "ts": ts,
        "asset_id": asset_id,
        "kid": kid,
        "api_secret_hash": api_secret_hash
    }

    write_json(os.path.join(DATA_DIR, "identity.latest.public.json"), public_doc)
    write_json(os.path.join(DATA_DIR, "identity.private.json"), private_doc)

    append_audit({
        "ts": ts,
        "event": "IDENTITY_BORN",
        "asset_id": asset_id,
        "kid": kid,
        "qr_ref": qr_ref,
        "pair_commit": pair_commit
    })

    # Optional: show api_key ONCE in terminal (ops can copy it)
    print("\n[IDENTITY-GEN] ✅ QR + API birthed together")
    print("asset_id :", asset_id)
    print("kid      :", kid)
    print("qr_ref   :", qr_ref)
    print("commit   :", pair_commit)
    print("\n[ONE-TIME SECRET] api_key (copy now, not stored):")
    print(api_key)
    print("------------------------------------------------\n")

    return public_doc

if __name__ == "__main__":
    # örnek
    create_asset_identity("MEDICAL_SUPPLY", "NJ_WAREHOUSE_01")
