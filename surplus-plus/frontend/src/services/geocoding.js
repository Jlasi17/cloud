// Geocoding service utilities
export const getGeocodingClient = () => {
  if (!window.google || !window.google.maps) {
    console.warn('Google Maps API not loaded yet');
    return null;
  }
  return new window.google.maps.Geocoder();
};

export const geocodeAddress = async (address) => {
  const geocoder = getGeocodingClient();
  try {
    const response = await new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
    
    if (response && response[0]) {
      return {
        address: response[0].formatted_address,
        location: {
          lat: response[0].geometry.location.lat(),
          lng: response[0].geometry.location.lng()
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

export const reverseGeocode = async (lat, lng) => {
  const geocoder = getGeocodingClient();
  if (!geocoder) {
    console.warn('Geocoder not available - Google Maps API might not be loaded');
    return null;
  }
  
  try {
    const response = await new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK') {
          resolve(results);
        } else {
          console.warn(`Reverse geocoding failed with status: ${status}`);
          resolve(null); // Resolve with null instead of rejecting
        }
      });
    });
    
    if (response && response[0]) {
      return {
        address: response[0].formatted_address,
        location: { lat, lng }
      };
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};
