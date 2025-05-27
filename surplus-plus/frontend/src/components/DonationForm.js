import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  InputAdornment,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { Restaurant as FoodIcon, AccessTime as TimeIcon, LocationOn, AttachMoney, MyLocation, LocationSearching } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Map from './maps/Map';
import useGeolocation from '../hooks/useGeolocation';
import { reverseGeocode } from '../services/geocoding';

const DonationForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const { location: userLocation, error: locationError } = useGeolocation();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    estimatedSpoilTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: '',
    marketCost: '',
    description: ''
  });

  const foodTypes = [
    'Pulses',
    'Packet Food',
    'Fruits & Vegetables',
    'Cooked Food',
    'Other',
  ];

  // Set initial location when geolocation is available
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Only set initial location if we don't have one and user location is available
        if (userLocation && !selectedLocation) {
          // Check if userLocation has valid coordinates
          if (userLocation.lat && userLocation.lng) {
            setSelectedLocation(userLocation);
            await updateAddressFromLocation(userLocation);
          }
        }
      } catch (error) {
        console.error('Error initializing location:', error);
      }
    };

    initializeLocation();
  }, [userLocation]); // Only depend on userLocation

  const updateAddressFromLocation = async (location) => {
    try {
      const result = await reverseGeocode(location.lat, location.lng);
      if (result) {
        setFormData(prev => ({
          ...prev,
          location: result.address
        }));
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: '' }));
        }
      }
    } catch (error) {
      console.error('Error updating address:', error);
      setErrors(prev => ({
        ...prev,
        location: 'Could not determine address for this location'
      }));
    }
  };

  const handleMapClick = (event) => {
    let lat, lng;
    
    // Handle both Google Maps event object and direct lat/lng object
    if (event.latLng) {
      // Google Maps event object
      lat = typeof event.latLng.lat === 'function' ? event.latLng.lat() : event.latLng.lat;
      lng = typeof event.latLng.lng === 'function' ? event.latLng.lng() : event.latLng.lng;
    } else if (event.lat && event.lng) {
      // Direct lat/lng object
      lat = event.lat;
      lng = event.lng;
    } else {
      console.error('Invalid map click event:', event);
      return;
    }
    
    const clickedLocation = { lat, lng };
    setSelectedLocation(clickedLocation);
    updateAddressFromLocation(clickedLocation);
  };

  const handleLocationClick = () => {
    setMapDialogOpen(true);
  };

  const handleMapDialogClose = () => {
    setMapDialogOpen(false);
  };

  const handleLocationSelect = () => {
    if (!selectedLocation) {
      setErrors(prev => ({
        ...prev,
        location: 'Please select a location on the map'
      }));
      return;
    }
    setMapDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target || {};
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateTimeChange = (date) => {
    setFormData(prev => ({
      ...prev,
      estimatedSpoilTime: date
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.foodType) newErrors.foodType = 'Food type is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.estimatedSpoilTime || formData.estimatedSpoilTime < new Date()) {
      newErrors.estimatedSpoilTime = 'Future date is required';
    }
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.marketCost || formData.marketCost <= 0) newErrors.marketCost = 'Valid cost is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setErrors({});
    setLoading(true);

    try {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const formattedData = {
        ...formData,
        estimatedSpoilTime: formData.estimatedSpoilTime.toISOString()
      };

      const response = await axiosInstance.post(endpoints.donations.create, formattedData);

      setSuccess(true);
      if (onSuccess) onSuccess();
      setFormData({
        foodType: '',
        quantity: '',
        estimatedSpoilTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        location: '',
        marketCost: '',
        description: ''
      });
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error creating donation:', error);
      
      if (error.response?.status === 401 && !error.isTokenExpired) {
        setErrors({
          general: 'Session expired. Please refresh the page and try again.',
        });
      } else if (error.response?.data?.message) {
        setErrors({
          general: error.response.data.message,
        });
      } else {
        setErrors({
          general: 'Failed to create donation. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: '800px',
          mx: 'auto',
          p: 4,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[4],
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box
            sx={{
              bgcolor: theme.palette.primary.light,
              p: 2,
              borderRadius: '50%',
              mb: 2,
              color: theme.palette.primary.main,
            }}
          >
            <FoodIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
            Share Food, Spread Joy
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Fill out the details of your food donation to help those in need
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Donation created successfully! Your generosity is appreciated.
                </Alert>
              )}
              {errors?.general && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.general}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.foodType}>
                <InputLabel id="food-type-label">Food Type *</InputLabel>
                <Select
                  labelId="food-type-label"
                  id="foodType"
                  name="foodType"
                  value={formData.foodType}
                  onChange={handleChange}
                  label="Food Type *"
                >
                  {foodTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.foodType && <FormHelperText>{errors.foodType}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="quantity"
                name="quantity"
                label="Quantity *"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity}
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg/pcs</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.estimatedSpoilTime}>
                <DateTimePicker
                  label="Estimated Spoil Time *"
                  value={formData.estimatedSpoilTime}
                  onChange={handleDateTimeChange}
                  minDateTime={new Date()}
                  inputFormat="MM/dd/yyyy hh:mm a"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.estimatedSpoilTime}
                      helperText={errors.estimatedSpoilTime}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon color={errors.estimatedSpoilTime ? "error" : "action"} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
                {errors.estimatedSpoilTime && (
                  <FormHelperText>{errors.estimatedSpoilTime}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="marketCost"
                name="marketCost"
                label="Market Cost *"
                type="number"
                value={formData.marketCost}
                onChange={handleChange}
                error={!!errors.marketCost}
                helperText={errors.marketCost}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney color={errors.marketCost ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="location"
                name="location"
                label="Pickup Location *"
                value={formData.location}
                onChange={handleChange}
                error={!!errors.location}
                helperText={errors.location || 'Click the location icon to select on map'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color={errors.location ? "error" : "action"} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Select location on map">
                        <IconButton 
                          onClick={handleLocationClick}
                          color={selectedLocation ? "primary" : "default"}
                        >
                          {selectedLocation ? <LocationSearching /> : <MyLocation />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                  readOnly: true,
                  onClick: handleLocationClick,
                  sx: { cursor: 'pointer' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Additional Details (Optional)"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Any special instructions, dietary information, or details about the food"
              />
            </Grid>

            <Dialog 
              open={mapDialogOpen} 
              onClose={handleMapDialogClose}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Select Location</DialogTitle>
              <DialogContent sx={{ height: '500px' }}>
                <Map
                  center={selectedLocation || userLocation}
                  onMapClick={handleMapClick}
                  markers={selectedLocation ? [{ position: selectedLocation }] : []}
                  style={{ height: '100%', width: '100%', borderRadius: '4px' }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleMapDialogClose}>Cancel</Button>
                <Button 
                  onClick={handleLocationSelect} 
                  variant="contained"
                  color="primary"
                  disabled={!selectedLocation}
                >
                  Select Location
                </Button>
              </DialogActions>
            </Dialog>

            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 2,
                mt: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onClose}
                  disabled={loading}
                  fullWidth={!success}
                  sx={{
                    py: 1.5,
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth={!success}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none',
                      bgcolor: theme.palette.primary.dark
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Share Your Donation'}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                * Required fields
              </Typography>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </LocalizationProvider>
  );
};

export default DonationForm;