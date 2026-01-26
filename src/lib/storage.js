// LocalStorage Utilities for Prayer Schedule App

const STORAGE_KEYS = {
    USER: "user",
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

/**
 * Clear selected city from localStorage
 */
export function clearSelectedCity() {
    try {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CITY);
    } catch (error) {
        console.error("Error clearing city from localStorage:", error);
    }
}

/**
 * Save user data to localStorage
 * @param {Object} user - User object
 */
export function saveUser(user) {
    try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
        console.error("Error saving user to localStorage:", error);
    }
}

/**
 * Get user data from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
export function getUser() {
    try {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Error reading user from localStorage:", error);
        return null;
    }
}

/**
 * Clear user data from localStorage (logout)
 */
export function clearUser() {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
        console.error("Error clearing user from localStorage:", error);
    }
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
    return getUser() !== null;
}

/**
 * Check if location is set
 * @returns {boolean}
 */
export function hasLocation() {
    return getSelectedCity() !== null;
}
