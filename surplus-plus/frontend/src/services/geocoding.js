// Geocoding service utilities
export const getGeocodingClient = () => {
  if (!window.google || !window.google.maps) {
    throw new Error('Google Maps API not loaded');
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
  try {
    const response = await new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK') {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
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
