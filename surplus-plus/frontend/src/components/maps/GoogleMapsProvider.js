import React, { useState, useEffect, useMemo } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/config';
import { CircularProgress, Typography, Box } from '@mui/material';

// Define libraries array as a static constant
const GOOGLE_MAPS_LIBRARIES = ['places'];

// A simple wrapper component to handle loading the Google Maps script
const GoogleMapsProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Check if Google Maps API is already loaded
  useEffect(() => {
    const handleScriptLoad = () => {
      setIsReady(true);
      setScriptLoaded(true);
    };

    const handleScriptError = (error) => {
      console.error('Error loading Google Maps script:', error);
      setLoadError('Failed to load Google Maps. Please check your internet connection and try again.');
      setIsReady(false);
      setScriptLoaded(false);
    };

    if (window.google && window.google.maps) {
      handleScriptLoad();
      return;
    }

    // Check if script is already in the document
    const script = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (script) {
      script.addEventListener('load', handleScriptLoad);
      script.addEventListener('error', handleScriptError);
      return () => {
        script.removeEventListener('load', handleScriptLoad);
        script.removeEventListener('error', handleScriptError);
      };
    }
  }, []);

  // Prevent rendering map components until the script is loaded
  const wrappedChildren = useMemo(() => {
    if (!isReady) {
      if (loadError) {
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              {loadError}
            </Typography>
            <Typography variant="body2">
              Please check your internet connection and refresh the page.
            </Typography>
          </Box>
        );
      }
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading Google Maps...
          </Typography>
        </Box>
      );
    }
    return children;
  }, [isReady, loadError, children]);

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      onLoad={() => setIsReady(true)}
      onError={(error) => {
        console.error('Error loading Google Maps:', error);
        setLoadError('Failed to load Google Maps. Please check your internet connection and try again.');
      }}
    >
      {wrappedChildren}
    </LoadScript>
  );
};

export default GoogleMapsProvider;
