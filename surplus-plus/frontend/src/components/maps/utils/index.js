/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula
 * @param {Object} point1 - First point with lat and lng properties
 * @param {Object} point2 - Second point with lat and lng properties
 * @param {boolean} inMiles - If true, returns distance in miles, otherwise in kilometers
 * @returns {number} Distance between the two points
 */
export const calculateDistance = (point1, point2, inMiles = false) => {
  const toRadian = (angle) => (Math.PI / 180) * angle;
  const earthRadius = inMiles ? 3956 : 6371; // Radius in miles or km

  const dLat = toRadian(point2.lat - point1.lat);
  const dLon = toRadian(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadian(point1.lat)) * Math.cos(toRadian(point2.lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  
  return distance;
};

/**
 * Formats a distance value with appropriate units
 * @param {number} distance - Distance value
 * @param {string} unit - Unit of measurement ('km' or 'mi')
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = 'km') => {
  if (distance < 1) {
    const meters = unit === 'km' ? distance * 1000 : distance * 1609.34;
    return `${Math.round(meters)} ${unit === 'km' ? 'm' : 'ft'}`;
  }
  return `${distance.toFixed(1)} ${unit}`;
};

/**
 * Formats a duration in seconds to a human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "2h 30m")
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0 min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

/**
 * Creates a Google Maps URL for directions between two points
 * @param {Object} origin - Origin point with lat and lng properties
 * @param {Object} destination - Destination point with lat and lng properties
 * @param {string} travelMode - Travel mode (driving, walking, bicycling, transit)
 * @returns {string} Google Maps URL
 */
export const getGoogleMapsDirectionsUrl = (origin, destination, travelMode = 'driving') => {
  if (!origin || !destination) return '#';
  
  const originStr = `${origin.lat},${origin.lng}`;
  const destStr = `${destination.lat},${destination.lng}`;
  
  return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=${travelMode}`;
};

/**
 * Gets the bounds that contain all the given points
 * @param {Array} points - Array of points with lat and lng properties
 * @returns {Object} Bounds object with ne (north-east) and sw (south-west) points
 */
export const getBoundsForPoints = (points) => {
  if (!points || points.length === 0) return null;
  
  // Initialize with the first point
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  
  // Find the boundaries
  points.forEach(point => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  });
  
  return {
    ne: { lat: maxLat, lng: maxLng },
    sw: { lat: minLat, lng: minLng }
  };
};

/**
 * Calculates the center point of multiple coordinates
 * @param {Array} points - Array of points with lat and lng properties
 * @returns {Object} Center point with lat and lng properties
 */
export const getCenterPoint = (points) => {
  if (!points || points.length === 0) return null;
  
  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  };
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} coord1 - First coordinate with lat and lng properties
 * @param {Object} coord2 - Second coordinate with lat and lng properties
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRad = (degrees) => {
  return degrees * Math.PI / 180;
};

/**
 * Get maximum allowed distance based on food type
 * @param {string} foodType - Type of food
 * @returns {number} Maximum allowed distance in kilometers
 */
export const getMaxDistanceForFoodType = (foodType) => {
  const distanceMap = {
    'Cooked Food': 10, // Fresh food needs to be delivered quickly
    'Fruits & Vegetables': 20, // Perishable but not as critical as cooked food
    'Packet Food': 40, // Non-perishable can travel further
    'Pulses': 40, // Non-perishable can travel further
    'Other': 30 // Default medium range
  };
  return distanceMap[foodType] || 30; // Default to 30km if food type not found
};
