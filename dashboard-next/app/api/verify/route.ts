import { NextResponse } from 'next/server';

// 1. MOCK DATABASE (Sanki gerçek veritabanından geliyormuş gibi)
// Burada anahtarları tanımlıyoruz. Her birinin hikayesi farklı.
const DATA_STORE: any = {
  "US-MIL-ALPHA": { 
    status: "VALID", 
    temp: 4.2, 
    lat: 38.8977, 
    lon: -77.0365, 
    location: "Pentagon Secure Storage, USA",
    lastCheck: "Just now"
  },
  "PHARMA-X-99": { 
    status: "VALID", 
    temp: -18.5, 
    lat: 52.5200, 
    lon: 13.4050, 
    location: "Berlin Cold Chain Depot, DE",
    lastCheck: "2 mins ago"
  },
  "BROKEN-SEAL": { 
    status: "INVALID", 
    temp: 28.5, // Kritik sıcaklık!
    lat: 41.0082, 
    lon: 28.9784, 
    location: "Unauthorized Zone, TR",
    lastCheck: "ALERT TRIGGERED"
  }
};

// 2. POST İsteğini Karşılayan Fonksiyon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    // Simüle edilmiş "İşlem Süresi" (Oracle ile konuşuyormuş gibi)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Veritabanında bu anahtar var mı?
    const record = DATA_STORE[apiKey];

    if (record) {
      // Anahtar bulundu, veriyi döndür
      return NextResponse.json({ 
        success: true, 
        data: record 
      });
    } else {
      // Anahtar yok
      return NextResponse.json({ 
        success: false, 
        message: "KEY NOT FOUND IN REGISTRY" 
      }, { status: 404 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: "SERVER ERROR" }, { status: 500 });
  }
}
