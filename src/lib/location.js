import { fetchAllCities } from "./api";

export async function detectLocationCity() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation tidak didukung oleh browser Anda."));
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Reverse geocoding using Nominatim OpenStreetMap API
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const data = await response.json();
                
                if (data && data.address) {
                    // Try to get the most relevant region name
                    const nominatimName = data.address.city || data.address.county || data.address.town || data.address.state || "";
                    
                    if (nominatimName) {
                        const cities = await fetchAllCities();
                        const matchedCity = findMatchingCity(nominatimName, cities);
                        if (matchedCity) {
                            resolve(matchedCity);
                            return;
                        }
                    }
                }
                reject(new Error("Tidak dapat menemukan kota yang cocok dengan lokasi Anda."));
            } catch (error) {
                reject(error);
            }
        }, (error) => {
            let errorMsg = "Gagal mendapatkan lokasi.";
            if (error.code === 1) errorMsg = "Izin lokasi ditolak.";
            if (error.code === 2) errorMsg = "Lokasi tidak tersedia.";
            if (error.code === 3) errorMsg = "Waktu permintaan lokasi habis.";
            reject(new Error(errorMsg));
        }, { timeout: 10000 });
    });
}

export function findMatchingCity(nominatimName, cities) {
    if (!nominatimName) return null;
    const search = nominatimName.toUpperCase();
    const cleanSearch = search
      .replace("KOTA ADMINISTRASI ", "")
      .replace("KABUPATEN ", "")
      .replace("KOTA ", "")
      .trim();
      
    // Sort cities by name length descending to match most specific names first
    // (e.g., matching "BANDUNG BARAT" before "BANDUNG")
    const sortedCities = [...cities].sort((a, b) => b.lokasi.length - a.lokasi.length);

    let match = sortedCities.find(c => {
        const cleanLokasi = c.lokasi.replace("KAB. ", "").replace("KOTA ", "").trim();
        // Exact match after cleaning
        if (cleanLokasi === cleanSearch) return true;
        
        return cleanLokasi.includes(cleanSearch) || cleanSearch.includes(cleanLokasi);
    });
    
    if (match) return match;
    
    // Fallback for Jakarta (MyQuran API groups it as 'KOTA JAKARTA' instead of separated regions)
    const strippedSearch = cleanSearch
      .replace(" SELATAN", "")
      .replace(" UTARA", "")
      .replace(" TIMUR", "")
      .replace(" BARAT", "")
      .replace(" PUSAT", "")
      .trim();
      
    match = sortedCities.find(c => {
        const cleanLokasi = c.lokasi.replace("KAB. ", "").replace("KOTA ", "").trim();
        return cleanLokasi === strippedSearch;
    });
    
    return match || null;
}
