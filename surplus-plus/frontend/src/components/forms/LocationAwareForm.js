import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Paper } from '@mui/material';
import Map from '../maps/Map';
import useGeolocation from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../services/geocoding';

const LocationAwareForm = ({ type = 'donor', onSubmit, initialValues = {} }) => {
  const { location, error: locationError, isLoading: isLoadingLocation } = useGeolocation();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    notes: '',
    ...initialValues
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Set initial location when geolocation is available
  useEffect(() => {
    if (location && !selectedLocation) {
      setSelectedLocation(location);
      updateAddressFromLocation(location);
    }
  }, [location]);

  const updateAddressFromLocation = async (location) => {
    try {
      const result = await reverseGeocode(location.lat, location.lng);
      if (result) {
        setFormData(prev => ({
          ...prev,
          address: result.address
        }));
        setAddressError('');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      setAddressError('Could not find address for this location');
    }
  };

  const handleMapClick = (event) => {
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setSelectedLocation(clickedLocation);
    updateAddressFromLocation(clickedLocation);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setAddressError('Please select a location on the map');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        location: selectedLocation
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        {type === 'donor' ? 'Donate Food' : 'Request Food'}
      </Typography>
      
      <Box sx={{ mb: 3, height: '300px', position: 'relative' }}>
        {isLoadingLocation ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Getting your location...</Typography>
          </Box>
        ) : locationError ? (
          <Box sx={{ p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 1 }}>
            <Typography>Location Error: {locationError}</Typography>
            <Typography variant="body2">Please enable location services or select a location on the map.</Typography>
          </Box>
        ) : (
          <Map
            center={selectedLocation}
            onMapClick={handleMapClick}
            markers={selectedLocation ? [{ position: selectedLocation }] : []}
            style={{ height: '100%', width: '100%', borderRadius: '4px' }}
          />
        )}
      </Box>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
        />
        
        <TextField
          fullWidth
          label="Contact Number"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          margin="normal"
          required
          type="tel"
        />
        
        <TextField
          fullWidth
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          margin="normal"
          required
          error={!!addressError}
          helperText={addressError}
          multiline
          rows={2}
        />
        
        <TextField
          fullWidth
          label={type === 'donor' ? 'Food Details' : 'Additional Notes'}
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={3}
        />
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || isLoadingLocation}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default LocationAwareForm;
