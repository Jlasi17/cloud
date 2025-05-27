import { useState, useEffect } from 'react';

export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateLocation = (position) => {
    const { latitude, longitude } = position.coords;
    setLocation({
      lat: latitude,
      lng: longitude
    });
    setError(null);
    setIsLoading(false);
  };

  const handleError = (error) => {
    setError(error.message || 'Unable to retrieve location');
    setIsLoading(false);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
        ...options
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return { location, error, isLoading };
};

export default useGeolocation;
