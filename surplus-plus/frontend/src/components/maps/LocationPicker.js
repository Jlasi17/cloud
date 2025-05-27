import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import Map from './Map';
import useGeocode from '../../hooks/useGeocode';

const LocationPicker = ({
  onLocationSelect,
  initialPosition,
  address,
  label = 'Select a location on the map',
  height = '400px',
  showAddress = true,
  disabled = false,
}) => {
  const [selectedPosition, setSelectedPosition] = useState(initialPosition || null);
  const [currentAddress, setCurrentAddress] = useState(address || '');
  const { reverseGeocode, isLoading: isGeocoding } = useGeocode();

  useEffect(() => {
    if (initialPosition) {
      setSelectedPosition(initialPosition);
    }
  }, [initialPosition]);

  useEffect(() => {
    setCurrentAddress(address || '');
  }, [address]);

  const handleMapClick = async (e) => {
    if (disabled) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const position = { lat, lng };
    
    setSelectedPosition(position);
    
    // Get address from coordinates
    const address = await reverseGeocode(lat, lng);
    if (address) {
      setCurrentAddress(address);
    }
    
    if (onLocationSelect) {
      onLocationSelect({
        position,
        address: address || '',
      });
    }
  };

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
      )}
      
      <Box sx={{ position: 'relative', height }}>
        <Map
          center={selectedPosition}
          onMapClick={handleMapClick}
          markers={
            selectedPosition
              ? [
                  {
                    position: selectedPosition,
                    info: { title: 'Selected Location' },
                  },
                ]
              : []
          }
          style={{ height: '100%' }}
        />
        
        {isGeocoding && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1000,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
      
      {showAddress && (
        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            <strong>Address:</strong> {currentAddress || 'Click on the map to select a location'}
          </Typography>
        </Box>
      )}
      
      {!selectedPosition && (
        <Box mt={2} textAlign="center">
          <Typography variant="body2" color="error">
            Please select a location on the map
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LocationPicker;
