export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;

/**
 * Calculates the forward azimuth / bearing from user's coordinates to Kaaba in degrees (0 - 360)
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @returns {number} Bearing in degrees from true north (0° = North, 90° = East, etc.)
 */
export function calculateQiblaBearing(userLat, userLng) {
  const phi1 = toRadians(userLat);
  const phi2 = toRadians(KAABA_COORDS.latitude);
  const deltaLambda = toRadians(KAABA_COORDS.longitude - userLng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculates great-circle distance between user's coordinates and Kaaba in kilometers
 * @param {number} userLat 
 * @param {number} userLng 
 * @returns {number} Distance in kilometers
 */
export function calculateDistanceToKaaba(userLat, userLng) {
  const R = 6371; // Earth's mean radius in km
  const phi1 = toRadians(userLat);
  const phi2 = toRadians(KAABA_COORDS.latitude);
  const deltaPhi = toRadians(KAABA_COORDS.latitude - userLat);
  const deltaLambda = toRadians(KAABA_COORDS.longitude - userLng);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Converts degree to Indonesian cardinal/intercardinal direction name
 * @param {number} degrees 
 * @returns {string} Direction name
 */
export function getCompassDirectionName(degrees) {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = [
    { name: "Utara", min: 337.5, max: 360 },
    { name: "Utara", min: 0, max: 22.5 },
    { name: "Timur Laut", min: 22.5, max: 67.5 },
    { name: "Timur", min: 67.5, max: 112.5 },
    { name: "Tenggara", min: 112.5, max: 157.5 },
    { name: "Selatan", min: 157.5, max: 202.5 },
    { name: "Barat Daya", min: 202.5, max: 247.5 },
    { name: "Barat", min: 247.5, max: 292.5 },
    { name: "Barat Laut", min: 292.5, max: 337.5 },
  ];

  for (const dir of directions) {
    if (normalized >= dir.min && normalized < dir.max) {
      return dir.name;
    }
  }
  return "Utara";
}
