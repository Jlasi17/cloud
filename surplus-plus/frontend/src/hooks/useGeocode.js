import { useState, useCallback } from 'react';

const useGeocode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const geocodeAddress = useCallback(async (address) => {
    if (!address) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK') {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });
      
      if (response && response[0]) {
        const { lat, lng } = response[0].geometry.location;
        return { lat: lat(), lng: lng() };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Could not find the address. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (lat === undefined || lng === undefined) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK') {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });
      
      if (response && response[0]) {
        return response[0].formatted_address;
      }
      return null;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setError('Could not find the address for these coordinates.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geocodeAddress, reverseGeocode, isLoading, error };
};

export default useGeocode;
