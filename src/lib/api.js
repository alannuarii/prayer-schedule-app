// API Helper Functions for Prayer Schedule App

const BASE_URL = "https://api.myquran.com/v2/sholat";

/**
 * Fetch all cities in Indonesia
 * @returns {Promise<Array>} Array of city objects with id and lokasi
 */
export async function fetchAllCities() {
    // Check localStorage cache first for instantaneous response
    if (typeof localStorage !== "undefined") {
        try {
            const cached = localStorage.getItem("all_cities_cache");
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Failed to read cities cache:", e);
        }
    }

    try {
        const response = await fetch(`${BASE_URL}/kota/semua`);
        const data = await response.json();

        if (data.status && Array.isArray(data.data)) {
            if (typeof localStorage !== "undefined") {
                try {
                    localStorage.setItem("all_cities_cache", JSON.stringify(data.data));
                } catch (e) {}
            }
            return data.data;
        }
        throw new Error("Failed to fetch cities");
    } catch (error) {
        console.error("Error fetching cities:", error);
        throw error;
    }
}

/**
 * Fetch prayer schedule for a specific city and date
 * @param {string} cityCode - City code (e.g., "1301" for Jakarta)
 * @param {string} date - Date in YYYY-MM-DD format or YYYY/MM/DD
 * @returns {Promise<Object>} Prayer schedule data
 */
export async function fetchPrayerSchedule(cityCode, date) {
    try {
        // Format date as YYYY/MM/DD for the API
        const formattedDate = date.replace(/-/g, '/');
        const response = await fetch(`${BASE_URL}/jadwal/${cityCode}/${formattedDate}`);
        const data = await response.json();

        if (data.status) {
            return data.data;
        }
        throw new Error("Failed to fetch prayer schedule");
    } catch (error) {
        console.error("Error fetching prayer schedule:", error);
        throw error;
    }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
