import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { 
  DEFAULT_MAP_CENTER, 
  DEFAULT_ZOOM, 
  MAP_CONTAINER_STYLE, 
  DEFAULT_MAP_OPTIONS, 
  TRAVEL_MODES,
  GOOGLE_MAPS_API_KEY
} from '../../config/config';
import { Box, Typography, CircularProgress } from '@mui/material';
import useGeolocation from '../../hooks/useGeolocation';
import GoogleMapsProvider from './GoogleMapsProvider';

// Check if Google Maps is loaded
const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps;
};

// Use the MAP_CONTAINER_STYLE from config
const containerStyle = MAP_CONTAINER_STYLE;

// Inner Map component that handles the actual map rendering
const MapComponent = ({
  center: propCenter = null,
  zoom = DEFAULT_ZOOM,
  markers = [],
  directions = null,
  onMapClick,
  onMarkerClick,
  onDirectionsChanged,
  onDistanceDurationUpdate,
  selectedMarker,
  children,
  style = {},
  options = {},
  showDirections = false,
  origin = null,
  destination = null,
  travelMode = TRAVEL_MODES.DRIVING,
  autoCenter = true,
  ...rest
}) => {
  const { location: userLocation, error: locationError } = useGeolocation();
  const [map, setMap] = useState(null);
  const [directionsResult, setDirectionsResult] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(isGoogleMapsLoaded());
  const directionsService = useRef(null);
  const distanceMatrixService = useRef(null);
  
  // Check if Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded()) {
      setMapsLoaded(true);
      return;
    }

    // If not loaded, set up a listener for when it does load
    const checkMapsLoaded = () => {
      if (isGoogleMapsLoaded()) {
        setMapsLoaded(true);
      }
    };

    // Check every 100ms if maps is loaded
    const interval = setInterval(checkMapsLoaded, 100);
    return () => clearInterval(interval);
  }, []);

  // Determine the center of the map
  const center = useMemo(() => {
    return propCenter || (autoCenter && userLocation) || DEFAULT_MAP_CENTER;
  }, [propCenter, autoCenter, userLocation]);

  // Initialize services when map loads
  const handleMapLoad = useCallback((map) => {
    setMap(map);
    
    // Initialize services when Google Maps is available
    if (window.google && window.google.maps) {
      directionsService.current = new window.google.maps.DirectionsService();
      distanceMatrixService.current = new window.google.maps.DistanceMatrixService();
      
      // If we have user location and autoCenter is true, pan to user's location
      if (autoCenter && userLocation) {
        map.panTo(userLocation);
        // Call onMapClick with user's location when it's updated
        if (onMapClick) {
          onMapClick({ latLng: userLocation });
        }
      }
      
      // If we have directions to show, calculate them
      if (showDirections && origin && destination) {
        // Use a small timeout to ensure the map is fully loaded
        const timer = setTimeout(() => {
          if (window.google && window.google.maps) {
            calculateDirections(origin, destination, travelMode);
          } else {
            console.warn('Google Maps not available for directions calculation');
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [showDirections, origin, destination, travelMode, autoCenter, userLocation, onMapClick, calculateDirections]);
  
  // Clean up on unmount
  const handleMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update map center when user location changes and autoCenter is true
  useEffect(() => {
    if (map && autoCenter && userLocation) {
      if (window.google && window.google.maps) {
        map.panTo(userLocation);
        // Call onMapClick with user's location when it's updated
        if (onMapClick) {
          onMapClick({ latLng: userLocation });
        }
      } else {
        console.warn('Google Maps not available for map panning');
      }
    }
  }, [userLocation, map, autoCenter, onMapClick]);

  // Calculate directions when origin or destination changes
  const calculateDirections = useCallback(async (origin, destination, travelMode) => {
    if (!origin || !destination || !directionsService.current || !distanceMatrixService.current) {
      return;
    }

    // Skip if Google Maps is not loaded yet
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps not loaded yet');
      return;
    }

    try {
      setIsDirectionsLoading(true);
      setDirectionsError(null);

      // Get directions
      const directionsResult = await directionsService.current.route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: travelMode,
      });

      // Get distance and duration
      const distanceMatrixResult = await distanceMatrixService.current.getDistanceMatrix({
        origins: [{ lat: origin.lat, lng: origin.lng }],
        destinations: [{ lat: destination.lat, lng: destination.lng }],
        travelMode: travelMode,
      });

      const distance = distanceMatrixResult.rows[0].elements[0].distance.value / 1000; // in km
      const duration = distanceMatrixResult.rows[0].elements[0].duration.value / 60; // in minutes

      setDirectionsResult(directionsResult);
      setDistance(distance);
      setDuration(duration);
      setDirectionsError(null);

      if (onDirectionsChanged) {
        onDirectionsChanged(directionsResult);
      }

      if (onDistanceDurationUpdate) {
        onDistanceDurationUpdate({ distance, duration });
      }
    } catch (error) {
      console.error('Error calculating directions:', error);
      setDirectionsError('Error calculating directions. Please try again.');
      setDirectionsResult(null);
      setDistance(null);
      setDuration(null);
    } finally {
      setIsDirectionsLoading(false);
    }
  }, [onDirectionsChanged, onDistanceDurationUpdate]);

  // Recalculate directions when origin, destination, or travel mode changes
  useEffect(() => {
    if (showDirections && origin && destination && directionsService.current && distanceMatrixService.current) {
      // Use a small timeout to ensure the map is fully loaded
      const timer = setTimeout(() => {
        if (window.google && window.google.maps) {
          calculateDirections(origin, destination, travelMode);
        } else {
          console.warn('Google Maps not available for directions calculation');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [origin, destination, travelMode, showDirections, calculateDirections]);

  const handleMapClick = useCallback((e) => {
    if (onMapClick && e && e.latLng) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, [onMapClick]);

  const handleMarkerClick = useCallback((marker, index) => {
    if (onMarkerClick) {
      onMarkerClick(marker, index);
    }
  }, [onMarkerClick]);

  const mapOptions = {
    ...DEFAULT_MAP_OPTIONS,
    ...options,
  };

  return (
    <div style={{ position: 'relative', ...containerStyle, ...style }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        onClick={handleMapClick}
        options={mapOptions}
        {...rest}
      >
          {/* Markers */}
          {markers.map((marker, index) => (
            <Marker
              key={marker.id || index}
              position={marker.position}
              onClick={() => handleMarkerClick(marker, index)}
              icon={marker.icon}
            >
              {marker.infoWindow && selectedMarker === marker && (
                <InfoWindow onCloseClick={() => onMarkerClick(null, index)}>
                  <div>{marker.infoWindow}</div>
                </InfoWindow>
              )}
            </Marker>
          ))}

          {/* Directions */}
          {showDirections && directionsResult && (
            <DirectionsRenderer
              directions={directionsResult}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#1976d2',
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}

          {children}
        </GoogleMap>

      {/* Loading indicator */}
      {isDirectionsLoading && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.7)"
          zIndex={1}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error message */}
      {directionsError && (
        <Box
          position="absolute"
          top={10}
          left={10}
          right={10}
          bgcolor="#ffebee"
          color="#d32f2f"
          p={2}
          borderRadius={1}
          boxShadow={1}
          zIndex={1}
        >
          <Typography variant="body2">{directionsError}</Typography>
        </Box>
      )}

      {/* Distance and duration info */}
      {distance !== null && duration !== null && (
        <Box
          position="absolute"
          bottom={10}
          left={10}
          bgcolor="white"
          p={1.5}
          borderRadius={1}
          boxShadow={2}
          zIndex={1}
        >
          <Typography variant="body2">
            <Box component="span" fontWeight="bold">Distance:</Box> {distance.toFixed(1)} km
          </Typography>
          <Typography variant="body2">
            <Box component="span" fontWeight="bold">Duration:</Box> {Math.round(duration)} min
          </Typography>
        </Box>
      )}
    </div>
  );
};

// Main Map component that handles script loading
const Map = (props) => {
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (isGoogleMapsLoaded()) {
      setIsMapsLoaded(true);
      return;
    }

    // If not loaded, set up a listener for when it does load
    const checkMapsLoaded = () => {
      if (isGoogleMapsLoaded()) {
        setIsMapsLoaded(true);
      }
    };

    // Check every 100ms if maps is loaded
    const interval = setInterval(checkMapsLoaded, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <GoogleMapsProvider>
      {isMapsLoaded ? (
        <MapComponent {...props} />
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          width: '100%',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}>
          <CircularProgress size={24} />
          <Typography variant="body1" sx={{ ml: 2 }}>Loading map...</Typography>
        </Box>
      )}
    </GoogleMapsProvider>
  );
};

export default Map;
