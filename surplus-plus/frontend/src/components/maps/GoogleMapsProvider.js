import React, { useState, useEffect, useMemo } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/config';
import { CircularProgress, Typography, Box } from '@mui/material';

// A simple wrapper component to handle loading the Google Maps script
const GoogleMapsProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Check if Google Maps API is already loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsReady(true);
      setScriptLoaded(true);
      return;
    }

    // Check if script is already in the document
    const script = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (script) {
      script.onload = () => {
        setIsReady(true);
        setScriptLoaded(true);
      };
      script.onerror = (error) => {
        console.error('Error loading Google Maps script:', error);
        setLoadError('Failed to load Google Maps. Please try again later.');
      };
    }
  }, []);

  // Handle script load errors
  const handleError = (error) => {
    console.error('Error loading Google Maps:', error);
    setLoadError('Failed to load Google Maps. Please try again later.');
  };

  // Handle successful script load
  const handleLoad = () => {
    setIsReady(true);
    setScriptLoaded(true);
  };

  // Prevent rendering map components until the script is loaded
  const wrappedChildren = useMemo(() => {
    if (!isReady) return null;
    return children;
  }, [isReady, children]);

  if (loadError) {
    return (
      <Box 
        sx={{
          p: 2,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          borderRadius: 1,
          textAlign: 'center',
          my: 2
        }}
      >
        <Typography variant="body1">
          {loadError}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Please check your internet connection and refresh the page.
        </Typography>
      </Box>
    );
  }

  // If script is already loaded but not ready yet, show loading
  if (scriptLoaded && !isReady) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Initializing map...</Typography>
      </Box>
    );
  }

  return (
    <>
      {!scriptLoaded ? (
        <Box sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API_KEY}
            onLoad={handleLoad}
            onError={handleError}
            loadingElement={
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>Loading Google Maps...</Typography>
              </Box>
            }
          >
            <div style={{ display: 'none' }}>Google Maps script loading...</div>
          </LoadScript>
        </Box>
      ) : (
        wrappedChildren
      )}
    </>
  );
};

export default GoogleMapsProvider;
