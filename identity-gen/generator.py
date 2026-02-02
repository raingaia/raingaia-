import uuid
import hashlib
import json
import datetime

def create_asset_identity(asset_type, origin):
    # 1. Benzersiz bir UUID oluştur
    raw_id = str(uuid.uuid4())
    
    # 2. Üretim bilgilerini içeren bir mühür taslağı oluştur
    timestamp = datetime.datetime.now().isoformat()
    identity_data = f"{asset_type}-{origin}-{timestamp}-{raw_id}"
    
    # 3. QR Kod için SHA-256 Hash üret
    qr_hash = hashlib.sha256(identity_data.encode()).hexdigest()[:16]
    
    identity_card = {
        "asset_id": raw_id,
        "type": asset_type,
        "origin": origin,
        "created_at": timestamp,
        "qr_code_hash": qr_hash,
        "status": "INITIALIZED"
    }
    
    # Kimliği dosyaya kaydet (C++ Oracle buradan okuyacak)
    with open('identity.json', 'w') as f:
        json.dump(identity_card, f, indent=4)
        
    print(f"\n[IDENTITY-GEN] New Asset Registered!")
    print(f"ID: {raw_id}")
    print(f"QR HASH: {qr_hash}")
    print(f"-----------------------------------")
    return identity_card

if __name__ == "__main__":
    # Örnek: ABD operasyonu için bir medikal kargo üretelim
    create_asset_identity("MEDICAL_SUPPLY", "NJ_WAREHOUSE_01")
