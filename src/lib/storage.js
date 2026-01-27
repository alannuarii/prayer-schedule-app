// LocalStorage Utilities for Prayer Schedule App

const STORAGE_KEYS = {
    SELECTED_CITY: "selectedCity"
};

/**
 * Save selected city to localStorage
 * @param {Object} city - City object with id and lokasi
 */
export function saveSelectedCity(city) {
    try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, JSON.stringify(city));
    } catch (error) {
        console.error("Error saving city to localStorage:", error);
    }
}

/**
 * Get selected city from localStorage
 * @returns {Object|null} City object or null if not set
 */
export function getSelectedCity() {
    try {
        const city = localStorage.getItem(STORAGE_KEYS.SELECTED_CITY);
        return city ? JSON.parse(city) : null;
    } catch (error) {
        console.error("Error reading city from localStorage:", error);
        return null;
    }
}

