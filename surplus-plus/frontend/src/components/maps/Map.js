import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Box, Typography, CircularProgress, Button } from '@mui/material';

// Default configuration
const DEFAULT_MAP_CENTER = {
  lat: 17.3850,  // Default to Hyderabad, India
  lng: 78.4867
};

const DEFAULT_ZOOM = 12;

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const DEFAULT_MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const Map = React.forwardRef((props, ref) => {
  const {
    center: propCenter = null,
    zoom = DEFAULT_ZOOM,
    markers = [],
    onMapClick,
    children,
    style = {},
    options = {},
    autoCenter = true,
    enableAutoTracking = false, // New prop to enable/disable auto-tracking
    trackingOptions = { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }, // New prop for tracking options
    ...rest
  } = props;

  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationName, setLocationName] = useState('Click on map to select location');
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const geocoder = useRef(null);
  
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // Initialize geocoder when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Determine the center of the map
  const center = useMemo(() => {
    return propCenter || (autoCenter && currentLocation) || DEFAULT_MAP_CENTER;
  }, [propCenter, autoCenter, currentLocation]);

  // Get location name from coordinates
  const getLocationName = useCallback((lat, lng) => {
    if (!geocoder.current) return;
    
    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          const address = results[0].formatted_address;
          setLocationName(address);
          
          if (onMapClick) {
            onMapClick({
              latLng: { lat, lng },
              address
            });
          }
        } else {
          setLocationName('No address found');
        }
      } else {
        console.error('Geocoder failed due to: ' + status);
        setLocationName('Could not get address');
      }
    });
  }, [onMapClick]);

  // Handle map load
  const handleMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  // Handle map unmount
  const handleMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle map click
  const handleMapClick = useCallback((e) => {
    if (e && e.latLng) {
      const location = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      
      setCurrentLocation(location);
      getLocationName(location.lat, location.lng);
      
      if (autoCenter && map) {
        map.panTo(location);
      }
    }
  }, [map, autoCenter, getLocationName]);

  // Toggle auto-tracking
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  }, [watchId]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by your browser';
      setLocationName(error);
      return Promise.reject(error);
    }

    const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    const isHttps = window.location.protocol === 'https:';

    if (!isLocalhost && !isHttps) {
      const error = 'Please use HTTPS or localhost for geolocation';
      setLocationName(error);
      return Promise.reject(error);
    }

    setIsTracking(true);
    
    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        getLocationName(location.lat, location.lng);
        
        if (map) {
          map.panTo(location);
        }
        
        if (onMapClick) {
          onMapClick({
            latLng: location,
            accuracy: position.coords.accuracy
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationName(`Error: ${error.message}`);
        setIsTracking(false);
      },
      trackingOptions
    );
    
    setWatchId(id);
    return id;
  }, [map, onMapClick, getLocationName, trackingOptions]);

  // Get user's current location once
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setLocationName(error);
        reject(error);
        return;
      }

      const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';

      if (!isLocalhost && !isHttps) {
        const error = 'Please use HTTPS or localhost for geolocation';
        setLocationName(error);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          getLocationName(location.lat, location.lng);
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Error getting your location';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get your location timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }
          setLocationName(errorMessage);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [getLocationName]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Start auto-tracking if enabled
  useEffect(() => {
    if (enableAutoTracking) {
      startTracking();
    }
    
    return () => {
      if (enableAutoTracking) {
        stopTracking();
      }
    };
  }, [enableAutoTracking, startTracking, stopTracking]);

  // Expose functions via ref
  React.useImperativeHandle(ref, () => ({
    getCurrentLocation,
    getCurrentAddress: () => locationName,
    getMap: () => map,
    startTracking,
    stopTracking,
    toggleTracking,
    isTracking: () => isTracking
  }));

  if (loadError) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          p: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Error loading map
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {loadError.message || 'Failed to load Google Maps'}
        </Typography>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          p: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading map...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', ...MAP_CONTAINER_STYLE }}
        center={center}
        zoom={zoom}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        onClick={handleMapClick}
        options={{
          ...DEFAULT_MAP_OPTIONS,
          ...options,
        }}
        {...rest}
      >
        {children}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            title={marker.title}
            icon={marker.icon}
          />
        ))}
      </GoogleMap>
      
      {/* Location info */}
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        left: 16, 
        right: 16,
        backgroundColor: 'white', 
        padding: 1.5, 
        borderRadius: 1, 
        boxShadow: 3,
        zIndex: 1,
        maxWidth: 400,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, mr: 1 }}>
          {locationName}
        </Typography>
        <Button 
          variant={isTracking ? 'contained' : 'outlined'}
          color="primary"
          size="small"
          onClick={toggleTracking}
          startIcon={
            isTracking ? (
              <Box component="span" sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: 'error.main',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 }
                }
              }} />
            ) : (
              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main' }} />
            )
          }
        >
          {isTracking ? 'Tracking' : 'Track Me'}
        </Button>
      </Box>
    </Box>
  );
});

Map.displayName = 'Map';

export default Map;