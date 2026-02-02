import json
import sys

def run_edge_check(asset_id, temp, lat, lon):
    try:
        with open('rules.json', 'r') as f:
            rules = json.load(f)
        
        # Eğer ID listede yoksa ALPHA-1 kurallarını baz al
        rule = rules.get(asset_id, rules["ALPHA-1"])
        
        print(f"\n[EDGE-CASE ANALYSIS] Asset: {asset_id}")
        print(f"Checking Parameters: Temp={temp}C, Lat={lat}, Lon={lon}")

        # 1. Termal Denetim (Thermal Breach)
        if temp > rule['max_temp'] or temp < rule['min_temp']:
            return False, f"CRITICAL: Thermal Violation! ({temp}C is outside {rule['min_temp']}-{rule['max_temp']}C range)"

        # 2. Coğrafi Denetim (Geofence Breach)
        lat_diff = abs(lat - rule['allowed_zone'][0])
        lon_diff = abs(lon - rule['allowed_zone'][1])
        if lat_diff > 0.5 or lon_diff > 0.5:
            return False, f"CRITICAL: Geographic Deviation detected!"

        return True, "SIGNAL AUTHENTICATED: All cases validated. Secure for Minting."

    except Exception as e:
        return False, f"SYSTEM ERROR: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python validator.py <ID> <TEMP> <LAT> <LON>")
    else:
        success, message = run_edge_check(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]))
        print(f"\nRESULT: {'✅' if success else '❌'} {message}")
