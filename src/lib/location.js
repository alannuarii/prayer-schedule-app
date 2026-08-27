import { fetchAllCities } from "./api";

/**
 * Detect user's city based on GPS coordinates and reverse geocoding
 * @returns {Promise<Object>} City object with id and lokasi
 */
export async function detectLocationCity() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung oleh browser Anda."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const candidates = await getReverseGeocodeCandidates(lat, lon);
          const cities = await fetchAllCities();

          for (const candidate of candidates) {
            const matchedCity = findMatchingCity(candidate, cities);
            if (matchedCity) {
              resolve(matchedCity);
              return;
            }
          }

          reject(new Error("Tidak dapat menemukan kota yang cocok dengan lokasi Anda."));
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMsg = "Gagal mendapatkan lokasi.";
        if (error.code === 1) errorMsg = "Izin lokasi ditolak.";
        if (error.code === 2) errorMsg = "Lokasi tidak tersedia.";
        if (error.code === 3) errorMsg = "Waktu permintaan lokasi habis.";
        reject(new Error(errorMsg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
}

/**
 * Fetch reverse geocode candidates from multiple sources (BigDataCloud & Nominatim)
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<Array<string>>} List of candidate place names
 */
async function getReverseGeocodeCandidates(lat, lon) {
  const candidates = [];

  // Source 1: BigDataCloud (Client-side free reverse geocoding API)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      if (bdcData.localityInfo?.administrative) {
        // Collect administrative divisions (level 5 = Kabupaten/Kota, level 6 = Kecamatan)
        for (const admin of bdcData.localityInfo.administrative) {
          if (admin.name && admin.adminLevel >= 5) {
            candidates.push(admin.name);
          }
        }
      }
      if (bdcData.city) candidates.push(bdcData.city);
      if (bdcData.locality) candidates.push(bdcData.locality);
    }
  } catch (err) {
    console.warn("BigDataCloud geocode failed, falling back to Nominatim:", err);
  }

  // Source 2: Nominatim OpenStreetMap
  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      if (osmData?.address) {
        // In Indonesia: county is usually Kabupaten (e.g. Kepulauan Sangihe), city is Kota / Kelurahan
        if (osmData.address.county) candidates.push(osmData.address.county);
        if (osmData.address.city) candidates.push(osmData.address.city);
        if (osmData.address.town) candidates.push(osmData.address.town);
        if (osmData.address.municipality) candidates.push(osmData.address.municipality);
        if (osmData.address.city_district) candidates.push(osmData.address.city_district);
        if (osmData.address.suburb) candidates.push(osmData.address.suburb);
      }
    }
  } catch (err) {
    console.warn("Nominatim geocode failed:", err);
  }

  // Return unique candidate names
  return Array.from(new Set(candidates.filter(Boolean)));
}

/**
 * Match a candidate name to the list of cities from MyQuran API
 * @param {string} searchName 
 * @param {Array} cities 
 * @returns {Object|null} Matching city object or null
 */
export function findMatchingCity(searchName, cities) {
  if (!searchName || typeof searchName !== "string") return null;

  const search = searchName
    .toUpperCase()
    .replace("KOTA ADMINISTRASI ", "")
    .replace("KABUPATEN ", "")
    .replace("KOTA ", "")
    .replace("KECAMATAN ", "")
    .replace("KELURAHAN ", "")
    .replace("DESA ", "")
    .trim();

  if (!search || search.length < 3) return null;

  // Sort cities by name length descending to match most specific names first
  const sortedCities = [...cities].sort((a, b) => b.lokasi.length - a.lokasi.length);

  // 1. Exact match
  let match = sortedCities.find((c) => {
    const cleanLokasi = c.lokasi.replace("KAB. ", "").replace("KOTA ", "").trim();
    return cleanLokasi === search;
  });
  if (match) return match;

  // 2. Substring match
  match = sortedCities.find((c) => {
    const cleanLokasi = c.lokasi.replace("KAB. ", "").replace("KOTA ", "").trim();
    return cleanLokasi.includes(search) || search.includes(cleanLokasi);
  });
  if (match) return match;

  // 3. Fallback for Jakarta regions
  const strippedSearch = search
    .replace(" SELATAN", "")
    .replace(" UTARA", "")
    .replace(" TIMUR", "")
    .replace(" BARAT", "")
    .replace(" PUSAT", "")
    .trim();

  if (strippedSearch === "JAKARTA") {
    match = sortedCities.find((c) => c.lokasi.includes("JAKARTA"));
    if (match) return match;
  }

  // 4. Significant word match (word length >= 4, ignoring generic regional words)
  const genericWords = new Set([
    "KEPULAUAN", "PULAU", "UTARA", "SELATAN", "BARAT", "TIMUR", "TENGAH", "BESAR", "KABUPATEN", "KOTA"
  ]);
  const words = search.split(/\s+/).filter((w) => w.length >= 4 && !genericWords.has(w));
  for (const word of words) {
    match = sortedCities.find((c) => {
      const cleanLokasi = c.lokasi.replace("KAB. ", "").replace("KOTA ", "").trim();
      const cityWords = cleanLokasi.split(/\s+/);
      return cityWords.includes(word);
    });
    if (match) return match;
  }

  return null;
}
