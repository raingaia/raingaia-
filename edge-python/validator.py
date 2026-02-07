import json, sys, os, time, math, hashlib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IDENTITY_PATH = os.path.join(ROOT, "identity-gen", "identity.json")
ORACLE_LATEST_PATH = os.path.join(ROOT, "oracle_latest.json")
ORACLE_STATE_PATH = os.path.join(ROOT, "oracle_state.json")
EDGE_OUT_PATH = os.path.join(ROOT, "edge_result.json")

# policy (Oracle ile aynı)
POLICY = {
    "max_temp_delta": 2.0,
    "max_hum_delta": 12.0,
    "max_dist_m": 250.0,
    "bucket_sec": 5,
}

def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def read_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def haversine_m(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def bucket_time(ts: int, bucket_sec: int) -> int:
    return (ts // bucket_sec) * bucket_sec

def sensor_fingerprint(tempC, humidity, lat, lon) -> str:
    # Oracle ile aynı normalize:
    T = round(float(tempC) * 10.0)      # 0.1C
    H = round(float(humidity) * 10.0)   # 0.1%
    La = round(float(lat) * 10000.0)    # ~11m
    Lo = round(float(lon) * 10000.0)
    return sha256_hex(f"SENS|{T}|{H}|{La}|{Lo}")

def verify_chain(oracle_latest: dict) -> (bool, str):
    # chain basic: prev_seal + seal exist
    if "seal" not in oracle_latest or "prev_seal" not in oracle_latest:
        return False, "MISSING_SEAL_FIELDS"
    if len(str(oracle_latest["seal"])) < 32:
        return False, "SEAL_TOO_SHORT"
    return True, "OK"

def verify_binding(identity: dict, oracle_latest: dict) -> (bool, str):
    # QR hash match
    if identity.get("qr_code_hash") != oracle_latest.get("qr_hash"):
        return False, "QR_HASH_MISMATCH"
    # asset id match
    if identity.get("asset_id") != oracle_latest.get("asset_id"):
        return False, "ASSET_ID_MISMATCH"
    # api_commit / pair_commit exist
    if not oracle_latest.get("api_commit") or not oracle_latest.get("pair_commit"):
        return False, "MISSING_COMMITS"
    return True, "OK"

def verify_drift(prev_sensor: dict, cur_sensor: dict) -> (bool, str, dict):
    dT = abs(float(cur_sensor["tempC"]) - float(prev_sensor["tempC"]))
    dH = abs(float(cur_sensor["humidity"]) - float(prev_sensor["humidity"]))
    dD = haversine_m(float(cur_sensor["lat"]), float(cur_sensor["lon"]),
                    float(prev_sensor["lat"]), float(prev_sensor["lon"]))
    info = {"dT": dT, "dH": dH, "dD_m": dD}

    if dT > POLICY["max_temp_delta"]:
        return False, "THERMAL_DRIFT", info
    if dH > POLICY["max_hum_delta"]:
        return False, "HUMIDITY_DRIFT", info
    if dD > POLICY["max_dist_m"]:
        return False, "GEO_DRIFT", info
    return True, "OK", info

def run_edge_check(tempC, humidity, lat, lon):
    # 1) load identity + oracle
    if not os.path.exists(IDENTITY_PATH):
        return False, f"IDENTITY_NOT_FOUND: {IDENTITY_PATH}", {}
    if not os.path.exists(ORACLE_LATEST_PATH):
        return False, f"ORACLE_LATEST_NOT_FOUND: {ORACLE_LATEST_PATH}", {}

    identity = read_json(IDENTITY_PATH)
    oracle_latest = read_json(ORACLE_LATEST_PATH)

    # 2) verify binding (QR+API together meaning)
    ok, reason = verify_binding(identity, oracle_latest)
    if not ok:
        return False, f"BINDING_FAIL:{reason}", {"identity": identity, "oracle": oracle_latest}

    # 3) verify chain minimal
    ok, reason = verify_chain(oracle_latest)
    if not ok:
        return False, f"CHAIN_FAIL:{reason}", {"oracle": oracle_latest}

    # 4) verify sensor fingerprint matches oracle_latest bucket logic
    cur_sensor = {"tempC": tempC, "humidity": humidity, "lat": lat, "lon": lon}
    sfp = sensor_fingerprint(tempC, humidity, lat, lon)

    oracle_sfp = oracle_latest.get("sensor_fingerprint")
    if oracle_sfp and oracle_sfp != sfp:
        return False, "SENSOR_FINGERPRINT_MISMATCH", {
            "edge_sfp": sfp,
            "oracle_sfp": oracle_sfp
        }

    # 5) drift check vs oracle_state if available
    drift_ok = True
    drift_reason = "OK_NO_PREV"
    drift_info = {}
    if os.path.exists(ORACLE_STATE_PATH):
        st = read_json(ORACLE_STATE_PATH)
        if "prev_tempC" in st:
            prev_sensor = {
                "tempC": st.get("prev_tempC", 0),
                "humidity": st.get("prev_humidity", 0),
                "lat": st.get("prev_lat", 0),
                "lon": st.get("prev_lon", 0),
            }
            drift_ok, drift_reason, drift_info = verify_drift(prev_sensor, cur_sensor)

    # 6) finalize
    result = {
        "ts": int(time.time()),
        "asset_id": identity.get("asset_id"),
        "kid": oracle_latest.get("kid"),
        "qr_hash": oracle_latest.get("qr_hash"),
        "api_commit": oracle_latest.get("api_commit"),
        "pair_commit": oracle_latest.get("pair_commit"),
        "seal": oracle_latest.get("seal"),
        "prev_seal": oracle_latest.get("prev_seal"),
        "sensor": cur_sensor,
        "sensor_fingerprint": sfp,
        "drift_ok": drift_ok,
        "drift_reason": drift_reason,
        "drift_info": drift_info,
        "edge_ok": True if drift_ok else False,
    }

    # write edge output
    with open(EDGE_OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    if drift_ok:
        return True, "EDGE_OK: Verified binding + chain + drift", result
    return False, f"EDGE_FAIL:{drift_reason}", result


if __name__ == "__main__":
    # Usage:
    # python validator.py <TEMP> <HUM> <LAT> <LON>
    if len(sys.argv) < 5:
        print("Usage: python validator.py <TEMP> <HUM> <LAT> <LON>")
        sys.exit(1)

    TEMP = float(sys.argv[1])
    HUM  = float(sys.argv[2])
    LAT  = float(sys.argv[3])
    LON  = float(sys.argv[4])

    success, message, payload = run_edge_check(TEMP, HUM, LAT, LON)
    print(f"[EDGE] {'✅' if success else '❌'} {message}")
    if payload:
        print(f"[EDGE] wrote: {EDGE_OUT_PATH}")
