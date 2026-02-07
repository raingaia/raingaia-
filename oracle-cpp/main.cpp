#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <iomanip>
#include <cmath>      // ← burası önemli
#include <ctime>
#include <map>

// M_PI fix (MSYS2 / MinGW için)
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// OpenSSL SHA256
#include <openssl/sha.h>

static std::string trim(const std::string& s) {
  size_t a = s.find_first_not_of(" \t\r\n");
  size_t b = s.find_last_not_of(" \t\r\n");
  if (a == std::string::npos) return "";
  return s.substr(a, b - a + 1);
}

// Basit JSON field okuyucu (identity.json çok basit olduğu için yeterli)
// identity.json alanları: asset_id, qr_code_hash, created_at, origin, type...
static std::string read_json_string_field(const std::string& json, const std::string& key) {
  // "key": "value"
  std::string pat = "\"" + key + "\"";
  auto p = json.find(pat);
  if (p == std::string::npos) return "";
  p = json.find(":", p);
  if (p == std::string::npos) return "";
  p = json.find("\"", p);
  if (p == std::string::npos) return "";
  auto q = json.find("\"", p + 1);
  if (q == std::string::npos) return "";
  return json.substr(p + 1, q - (p + 1));
}

static std::string sha256_hex(const std::string& input) {
  unsigned char hash[SHA256_DIGEST_LENGTH];
  SHA256_CTX sha256;
  SHA256_Init(&sha256);
  SHA256_Update(&sha256, input.data(), input.size());
  SHA256_Final(hash, &sha256);

  std::ostringstream ss;
  ss << std::hex << std::setfill('0');
  for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
    ss << std::setw(2) << (int)hash[i];
  }
  return ss.str();
}

static long long now_unix() {
  return (long long)std::time(nullptr);
}

static long long bucket_time(long long ts, int seconds_bucket) {
  return (ts / seconds_bucket) * seconds_bucket;
}

static double deg2rad(double d) { constexpr double PI = 3.14159265358979323846; return d * PI / 180.0; }

// Haversine distance (meters)
static double haversine_m(double lat1, double lon1, double lat2, double lon2) {
  const double R = 6371000.0; // meters
  double dLat = deg2rad(lat2 - lat1);
  double dLon = deg2rad(lon2 - lon1);
  double a =
      std::sin(dLat / 2) * std::sin(dLat / 2) +
      std::cos(deg2rad(lat1)) * std::cos(deg2rad(lat2)) *
      std::sin(dLon / 2) * std::sin(dLon / 2);
  double c = 2 * std::atan2(std::sqrt(a), std::sqrt(1 - a));
  return R * c;
}

struct Sensor {
  double tempC = 0;
  double humidity = 0;
  double lat = 0;
  double lon = 0;
};

struct PrevState {
  bool has_prev = false;
  std::string prev_seal;
  Sensor prev_sensor;
  long long prev_ts = 0;
};

// Üretim için eşikler
struct Policy {
  double max_temp_delta = 2.0;       // °C
  double max_hum_delta = 12.0;       // %
  double max_dist_m = 250.0;         // m
};

// Basit state dosyası: oracle_state.json
static PrevState load_state(const std::string& path) {
  PrevState st;
  std::ifstream f(path);
  if (!f.good()) return st;

  std::stringstream buf;
  buf << f.rdbuf();
  std::string j = buf.str();

  st.prev_seal = read_json_string_field(j, "prev_seal");
  std::string t = read_json_string_field(j, "prev_ts");
  // prev_ts string olarak yazacağız; buradan parse edelim
  if (!t.empty()) {
    try { st.prev_ts = std::stoll(t); } catch (...) {}
  }

  auto read_num = [&](const std::string& k)->double {
    // "k": 12.34
    std::string pat = "\"" + k + "\"";
    auto p = j.find(pat);
    if (p == std::string::npos) return 0;
    p = j.find(":", p);
    if (p == std::string::npos) return 0;
    // sayı başlangıcı
    p++;
    while (p < j.size() && (j[p] == ' ' || j[p] == '\t')) p++;
    size_t q = p;
    while (q < j.size() && (std::isdigit(j[q]) || j[q] == '.' || j[q] == '-' )) q++;
    std::string num = j.substr(p, q - p);
    try { return std::stod(num); } catch (...) { return 0; }
  };

  st.prev_sensor.tempC = read_num("prev_tempC");
  st.prev_sensor.humidity = read_num("prev_humidity");
  st.prev_sensor.lat = read_num("prev_lat");
  st.prev_sensor.lon = read_num("prev_lon");

  st.has_prev = !st.prev_seal.empty();
  return st;
}

static void save_state(const std::string& path, const PrevState& st) {
  std::ofstream o(path, std::ios::trunc);
  o <<
R"({
  "prev_seal": ")" << st.prev_seal << R"(",
  "prev_ts": ")" << st.prev_ts << R"(",
  "prev_tempC": )" << st.prev_sensor.tempC << R"(,
  "prev_humidity": )" << st.prev_sensor.humidity << R"(,
  "prev_lat": )" << st.prev_sensor.lat << R"(,
  "prev_lon": )" << st.prev_sensor.lon << R"(
}
)";
}

class OracleEngine {
private:
  // identity-gen’den gelecek:
  std::string asset_id;
  std::string qr_hash;

  // Oracle’ın secret’ı (prod’da ENV’den okunmalı)
  std::string oracle_secret;

  // türetilmiş şeyler:
  std::string kid;          // public
  std::string api_commit;   // api key değil, commit/türev
  std::string pair_commit;  // qr_hash + api_commit + secret => bağ

  PrevState prev;
  Policy policy;

  int seal_bucket_sec = 5; // 1/5/10 sn seçebilirsin

public:
  OracleEngine(std::string secret, int bucketSec = 5)
      : oracle_secret(std::move(secret)), seal_bucket_sec(bucketSec) {}

  bool loadIdentityFromFile(const std::string& identityPath) {
    std::ifstream f(identityPath);
    if (!f.good()) {
      std::cerr << "[ORACLE] identity.json bulunamadı: " << identityPath << std::endl;
      return false;
    }
    std::stringstream buf;
    buf << f.rdbuf();
    std::string j = buf.str();

    asset_id = read_json_string_field(j, "asset_id");
    qr_hash  = read_json_string_field(j, "qr_code_hash");

    if (asset_id.empty() || qr_hash.empty()) {
      std::cerr << "[ORACLE] identity.json eksik alan: asset_id / qr_code_hash" << std::endl;
      return false;
    }

    // kid: public identifier (asset_id + qr_hash’ın kısası)
    kid = sha256_hex("KID|" + asset_id + "|" + qr_hash).substr(0, 16);

    // API KEY kendiliğinden doğuyor (ama plaintext’i dışarı vermiyoruz)
    // (Gerçekte plaintext’i sadece backend kontrolünde tutarsın, burada commit üretip çıkıyoruz)
    std::string api_key_plain = sha256_hex("API|" + oracle_secret + "|" + kid + "|" + qr_hash);

    // commit: dışarıda dolaşan şey bu olsun
    api_commit = sha256_hex("COMMIT|" + api_key_plain).substr(0, 32);

    // QR+API anlamını bağlayan kilit:
    pair_commit = sha256_hex("PAIR|" + qr_hash + "|" + api_commit + "|" + oracle_secret);

    return true;
  }

  void loadPrevState(const std::string& statePath) {
    prev = load_state(statePath);
  }

  // sensor fingerprint (normalize + sha)
  std::string sensorFingerprint(const Sensor& s) const {
    long long T = (long long)std::llround(s.tempC * 10.0);      // 0.1C
    long long H = (long long)std::llround(s.humidity * 10.0);   // 0.1%
    long long La = (long long)std::llround(s.lat * 10000.0);    // ~11m
    long long Lo = (long long)std::llround(s.lon * 10000.0);

    std::ostringstream ss;
    ss << "SENS|" << T << "|" << H << "|" << La << "|" << Lo;
    return sha256_hex(ss.str());
  }

  // drift check
  std::pair<bool, std::string> checkDrift(const Sensor& s) const {
    if (!prev.has_prev) return {true, "OK_FIRST_SEAL"};

    double dT = std::fabs(s.tempC - prev.prev_sensor.tempC);
    double dH = std::fabs(s.humidity - prev.prev_sensor.humidity);
    double dD = haversine_m(s.lat, s.lon, prev.prev_sensor.lat, prev.prev_sensor.lon);

    if (dT > policy.max_temp_delta) return {false, "THERMAL_DRIFT"};
    if (dH > policy.max_hum_delta) return {false, "HUMIDITY_DRIFT"};
    if (dD > policy.max_dist_m)    return {false, "GEO_DRIFT"};

    return {true, "OK"};
  }

  // seal üret (chain)
  std::string mintSeal(const Sensor& s, long long ts) const {
    long long tb = bucket_time(ts, seal_bucket_sec);
    std::string prev_seal = prev.has_prev ? prev.prev_seal : "GENESIS";

    std::string sfp = sensorFingerprint(s);

    std::ostringstream in;
    in << "SEAL|"
       << "kid=" << kid << "|"
       << "qr=" << qr_hash << "|"
       << "api_commit=" << api_commit << "|"
       << "pair_commit=" << pair_commit << "|"
       << "prev=" << prev_seal << "|"
       << "sfp=" << sfp << "|"
       << "tb=" << tb;

    return sha256_hex(in.str());
  }

  // işleyen ana fonksiyon: sensör geldiğinde çağır
  bool processSignal(const Sensor& s, const std::string& statePath, const std::string& outPath) {
    long long ts = now_unix();

    auto drift = checkDrift(s);
    std::string seal = mintSeal(s, ts);
    std::string sfp  = sensorFingerprint(s);

    // çıktı (dashboard bunu okuyacak)
    {
      std::ofstream o(outPath, std::ios::trunc);
      o <<
R"({
  "kid": ")" << kid << R"(",
  "asset_id": ")" << asset_id << R"(",
  "qr_hash": ")" << qr_hash << R"(",
  "api_commit": ")" << api_commit << R"(",
  "pair_commit": ")" << pair_commit << R"(",
  "ts": )" << ts << R"(,
  "bucket_sec": )" << seal_bucket_sec << R"(,
  "sensor": {
    "tempC": )" << s.tempC << R"(,
    "humidity": )" << s.humidity << R"(,
    "lat": )" << s.lat << R"(,
    "lon": )" << s.lon << R"(
  },
  "sensor_fingerprint": ")" << sfp << R"(",
  "prev_seal": ")" << (prev.has_prev ? prev.prev_seal : "GENESIS") << R"(",
  "seal": ")" << seal << R"(",
  "drift_ok": )" << (drift.first ? "true" : "false") << R"(,
  "drift_reason": ")" << drift.second << R"("
}
)";
    }

    // state güncelle
    PrevState next;
    next.has_prev = true;
    next.prev_seal = seal;
    next.prev_sensor = s;
    next.prev_ts = ts;
    save_state(statePath, next);

    return drift.first;
  }
};

int main(int argc, char** argv) {
  // Kullanım:
  // oracle.exe <tempC> <humidity> <lat> <lon>
  // ör: oracle.exe 24.5 55.1 41.0082 28.9784
  if (argc < 5) {
    std::cout << "Usage: oracle <tempC> <humidity> <lat> <lon>\n";
    return 1;
  }

  Sensor s;
  try {
    s.tempC = std::stod(argv[1]);
    s.humidity = std::stod(argv[2]);
    s.lat = std::stod(argv[3]);
    s.lon = std::stod(argv[4]);
  } catch (...) {
    std::cerr << "Invalid numeric args\n";
    return 1;
  }

  // PROD: bunu ENV’den okuyacağız
std::string ORACLE_SECRET = "ORACLE_SECRET_CHANGE_ME";

OracleEngine engine(ORACLE_SECRET, 5);

// identity artık data'dan okunuyor
if (!engine.loadIdentityFromFile("../data/identity.latest.public.json")) {
  return 1;
}

// önceki state
engine.loadPrevState("../data/oracle_state.json");

bool ok = engine.processSignal(
    s,
    "../data/oracle_state.json",
    "../data/oracle.latest.json"
);

std::cout << "[ORACLE] Seal minted. drift_ok=" << (ok ? "true" : "false") << "\n";
std::cout << "[ORACLE] Output: ../data/oracle.latest.json\n";
  return 0;
}
