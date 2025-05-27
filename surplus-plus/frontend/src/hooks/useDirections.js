import { useState, useEffect, useCallback } from 'react';
import { TRAVEL_MODES } from '../config/config';

const useDirections = () => {
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateRoute = useCallback(async (origin, destination, travelMode = TRAVEL_MODES.DRIVING) => {
    if (!window.google || !window.google.maps) {
      setError('Google Maps API not loaded');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin,
        destination,
        travelMode,
        provideRouteAlternatives: true,
      });

      if (results.routes && results.routes.length > 0) {
        const route = results.routes[0];
        setDirections(route);
        
        // Get the first leg of the first route
        if (route.legs && route.legs.length > 0) {
          const leg = route.legs[0];
          setDistance(leg.distance);
          setDuration(leg.duration);
        }
        
        return route;
      }
      return null;
    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Could not calculate route. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateDistanceMatrix = useCallback(async (origins, destinations, travelMode = TRAVEL_MODES.DRIVING) => {
    if (!window.google || !window.google.maps) {
      setError('Google Maps API not loaded');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const distanceMatrixService = new window.google.maps.DistanceMatrixService();
      const results = await new Promise((resolve, reject) => {
        distanceMatrixService.getDistanceMatrix(
          {
            origins,
            destinations,
            travelMode,
          },
          (response, status) => {
            if (status === 'OK') {
              resolve(response);
            } else {
              reject(status);
            }
          }
        );
      });

      return results;
    } catch (err) {
      console.error('Error calculating distance matrix:', err);
      setError('Could not calculate distances. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    directions,
    distance,
    duration,
    calculateRoute,
    calculateDistanceMatrix,
    isLoading,
    error,
  };
};

export default useDirections;
