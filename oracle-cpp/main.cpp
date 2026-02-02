#include <iostream>
#include <string>
#include <sstream>
#include <iomanip>
#include <functional>

class OracleEngine {
private:
    std::string qr_identity;
    std::string api_key_part;

public:
    OracleEngine(std::string qr, std::string key) : qr_identity(qr), api_key_part(key) {}

    std::string process_signal(float temperature, double lat, double lon) {
        std::stringstream ss;
        
        // Veri Paketleme
        ss << qr_identity << "|" << api_key_part << "|" 
           << temperature << "|" << lat << "," << lon;
        
        std::string raw_signal = ss.str();
        
        // Basit Hashleme (Simulasyon)
        std::hash<std::string> hasher;
        size_t hashed_value = hasher(raw_signal);
        
        std::stringstream hex_stream;
        hex_stream << std::hex << hashed_value;
        
        std::cout << "[ORACLE LOG] Ham Sinyal: " << raw_signal << std::endl;
        return hex_stream.str();
    }
};

int main() {
    // Test Verileri
    std::string qr_hash = "a1b2c3d4";
    std::string api_key = "secret_key_v1";
    
    OracleEngine engine(qr_hash, api_key);
    
    std::cout << "--- ORACLE CALISIYOR ---" << std::endl;
    std::string live_seal = engine.process_signal(24.5, 41.0082, 28.9784);
    
    std::cout << "--- CANLI MUHUR ---" << std::endl;
    std::cout << "Seal: " << live_seal << std::endl;
    
    return 0;
}
