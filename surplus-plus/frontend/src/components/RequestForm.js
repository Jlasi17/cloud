import React, { useState, useEffect } from 'react';
// Material-UI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import Fade from '@mui/material/Fade';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import {
  Restaurant as FoodIcon,
  Timer as TimeIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  LocalShipping as DeliveryIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Scale as ScaleIcon,
  ReportProblem as ReportProblemIcon,
  Notes as NotesIcon,
  MyLocation,
  LocationSearching
} from '@mui/icons-material';

import Map from './maps/Map';
import useGeolocation from '../hooks/useGeolocation';
import { reverseGeocode } from '../services/geocoding';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';
import { formatDistanceToNow } from 'date-fns';

const RequestForm = ({ onClose, onDonationSelect, initialData, onSuccess, mode = 'create' }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [isMatching, setIsMatching] = useState(mode === 'match');
  const [isFindingMatches, setIsFindingMatches] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const { location: userLocation, error: locationError } = useGeolocation();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [formData, setFormData] = useState({
    foodType: initialData?.foodType || '',
    quantity: initialData?.quantity || '',
    urgency: initialData?.urgency || 'Medium',
    location: initialData?.location || user?.address || '',
    notes: initialData?.notes || '',
  });

  // Set initial location when geolocation is available
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Only set initial location if we don't have one and user location is available
        if (userLocation && !selectedLocation) {
          // Check if userLocation has valid coordinates
          if (userLocation.lat && userLocation.lng) {
            setSelectedLocation(userLocation);
            if (!initialData?.location) {
              await updateAddressFromLocation(userLocation);
            }
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
  
  const [touched, setTouched] = useState({
    foodType: false,
    quantity: false,
    location: false,
    notes: false
  });

  const urgencyColors = {
    Low: 'success',
    Medium: 'warning',
    High: 'error'
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        foodType: initialData.foodType || '',
        quantity: initialData.quantity || '',
        urgency: initialData.urgency || 'Medium',
        location: initialData.location || user?.address || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData, user?.address]);

  const foodTypes = [
    'Pulses',
    'Packet Food',
    'Fruits & Vegetables',
    'Cooked Food',
    'Grains',
    'Dairy',
    'Bakery',
    'Meat & Poultry',
    'Other',
  ];

  const validateField = (name, value) => {
    switch (name) {
      case 'foodType':
        return !value ? 'Please select a food type' : '';
      case 'quantity':
        if (!value) return 'Please enter a quantity';
        if (isNaN(value) || Number(value) <= 0) return 'Please enter a valid quantity';
        return '';
      case 'location':
        if (!value.trim()) return 'Please enter a location';
        if (value.length > 200) return 'Location is too long (max 200 characters)';
        return '';
      case 'notes':
        if (value.length > 500) return 'Notes are too long (max 500 characters)';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    const processedValue = name === 'quantity' ? value.replace(/[^0-9.]/g, '') : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
    
    // Validate on change only if the field has been touched
    if (touched[name]) {
      const error = validateField(name, processedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const fetchMatchingDonations = async (requestData) => {
    try {
      console.log('Starting to fetch matching donations with data:', requestData);
      setLoading(true);
      setErrors(prev => ({ ...prev, matchingError: '' }));
      
      if (!requestData.foodType || !requestData.location) {
        throw new Error('Food type and location are required to find matches');
      }
      
      // Build query parameters
      const params = {
        status: 'available',
        foodType: requestData.foodType,
        // Don't filter by location on the server, we'll do it client-side for better matching
      };
      
      console.log('Making API request with params:', params);
      const response = await axiosInstance.get(endpoints.donations.list, { params });
      console.log('API Response:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response from server');
      }
      
      // Filter donations client-side for more flexible matching
      const filteredMatches = response.data.filter(donation => {
        // Skip if donation is not available
        if (donation.status !== 'available') return false;
        
        // Skip if it's the current user's donation
        if (user?._id && donation.donorId === user._id) return false;
        
        // Check if locations match (case insensitive, partial match)
        const requestLocation = requestData.location.toLowerCase().trim();
        const donationLocation = (donation.location || '').toLowerCase().trim();
        const locationMatch = donationLocation.includes(requestLocation) || 
                            requestLocation.includes(donationLocation);
        
        // Check if food types match (exact match for now)
        const foodTypeMatch = donation.foodType === requestData.foodType;
        
        // Check quantity if specified
        const quantityMatch = !requestData.quantity || 
                            (donation.quantity && donation.quantity >= Number(requestData.quantity));
        
        console.log(`Donation ${donation._id}: `, {
          locationMatch: { requestLocation, donationLocation },
          foodTypeMatch: { requestFoodType: requestData.foodType, donationFoodType: donation.foodType },
          quantityMatch: { requestQuantity: requestData.quantity, donationQuantity: donation.quantity },
          isAvailable: donation.status === 'available',
          isNotCurrentUser: !user?._id || donation.donorId !== user._id
        });
        
        return locationMatch && foodTypeMatch && quantityMatch;
      });
      
      console.log('Filtered matches:', filteredMatches);
      setMatches(filteredMatches);
      return filteredMatches;
    } catch (error) {
      console.error('Error fetching matching donations:', error);
      const errorMessage = error.response?.data?.message || 'Failed to find matching donations. Please try again.';
      setErrors(prev => ({
        ...prev,
        matchingError: errorMessage
      }));
      setSuccess('');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSelect = (donation) => {
    if (onDonationSelect) {
      onDonationSelect(donation);
    }
    if (onClose) onClose();
  };

  const checkExistingRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await axiosInstance.get(endpoints.requests.list, {
        params: {
          status: 'pending',
          foodType: formData.foodType,
          location: formData.location
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Return the first matching request if any
      return response.data?.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error checking for existing request:', error);
      return null;
    }
  };

  const findMatchingDonations = async (searchCriteria) => {
    try {
      console.log('Searching for donations with criteria:', searchCriteria);
      
      // Get all available donations
      const response = await axiosInstance.get(endpoints.donations.list, {
        params: {
          status: 'available'
        }
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      
      // Filter donations based on criteria
      const filteredDonations = response.data.filter(donation => {
        // Skip if it's the current user's donation
        if (user?._id && donation.donorId === user._id) return false;
        
        // Check food type match (case insensitive)
        const foodTypeMatch = donation.foodType?.toLowerCase() === searchCriteria.foodType?.toLowerCase();
        
        // Check location match (case insensitive partial match)
        const locationMatch = donation.location?.toLowerCase().includes(searchCriteria.location?.toLowerCase()) ||
                           searchCriteria.location?.toLowerCase().includes(donation.location?.toLowerCase());
        
        // Check quantity if specified
        const quantityMatch = !searchCriteria.quantity || 
                             (donation.quantity && donation.quantity >= Number(searchCriteria.quantity));
        
        return foodTypeMatch && locationMatch && quantityMatch;
      });
      
      return filteredDonations;
    } catch (error) {
      console.error('Error finding matching donations:', error);
      throw error;
    }
  };

  const handleFindMatches = async (e) => {
    if (e) e.preventDefault();
    
    // Clear previous state
    setErrors({});
    setSuccess('');
    setSearchPerformed(true);
    setIsFindingMatches(true);
    
    try {
      // Validate required fields
      if (!formData.foodType || !formData.location) {
        setErrors(prev => ({
          ...prev,
          general: 'Please select a food type and location to find matches'
        }));
        return;
      }
      
      setSuccess('Searching for matching donations...');
      
      // Find matching donations
      const matchingDonations = await findMatchingDonations({
        foodType: formData.foodType,
        location: formData.location,
        quantity: formData.quantity
      });
      
      console.log('Matching donations found:', matchingDonations);
      
      // Update state with matches
      setMatches(matchingDonations);
      setShowMatches(true);
      setIsMatching(true);
      
      if (matchingDonations.length === 0) {
        setSuccess('No matching donations found. Try adjusting your search criteria.');
      } else {
        setSuccess(`Found ${matchingDonations.length} matching donation${matchingDonations.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error in handleFindMatches:', error);
      setErrors({
        general: error.response?.data?.message || 'Failed to search for donations. Please try again.'
      });
    } finally {
      setIsFindingMatches(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate all required fields
    Object.keys(touched).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the field that just lost focus
    const error = validateField(name, formData[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');
    
    // Mark all fields as touched when form is submitted
    const newTouched = {};
    Object.keys(touched).forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    // Validate the entire form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to create a request');
      }

      const response = await axiosInstance.post(
        endpoints.requests.create, 
        {
          ...formData,
          quantity: Number(formData.quantity) || 1, // Default to 1 if not provided
          status: 'pending'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 201) {
        setSuccess('Request created successfully!');
        if (onSuccess) onSuccess(response.data);
        
        // Auto-find matches after successful submission
        await handleFindMatches();
      } else {
        throw new Error(response.data?.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setErrors(prev => ({
        ...prev,
        general: error.response?.data?.message || error.message || 'Failed to process request'
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatDateSafely = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatExpirySafely = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : formatDistanceToNow(date);
    } catch (e) {
      return null;
    }
  };

  const renderDonationCard = (donation) => {
    const postedDate = formatDateSafely(donation.createdAt);
    const expiryTime = formatExpirySafely(donation.estimatedSpoilTime);

    return (
      <Card 
        key={donation._id} 
        sx={{ 
          mb: 3, 
          width: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4]
          }
        }}
        elevation={2}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
                <FoodIcon color="primary" />
              </Avatar>
              <Typography variant="h6" fontWeight="medium">
                {donation.foodType || 'Food Donation'}
              </Typography>
            </Box>
            {donation.quantity && (
              <Chip 
                label={`${donation.quantity} kg`} 
                icon={<ScaleIcon fontSize="small" />}
                sx={{ bgcolor: theme.palette.grey[100] }}
              />
            )}
          </Stack>

          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.5}>
                <Box display="flex" alignItems="center">
                  <LocationIcon color="action" fontSize="small" sx={{ mr: 1.5 }} />
                  <Typography variant="body1">
                    {donation.location || 'Location not specified'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <PersonIcon color="action" fontSize="small" sx={{ mr: 1.5 }} />
                  <Typography variant="body1">
                    {donation.donorName || 'Anonymous'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1.5}>
                <Box display="flex" alignItems="center">
                  <TimeIcon color="action" fontSize="small" sx={{ mr: 1.5 }} />
                  <Typography variant="body2">
                    Posted {postedDate}
                  </Typography>
                </Box>
                {expiryTime && (
                  <Box display="flex" alignItems="center">
                    <ReportProblemIcon color="action" fontSize="small" sx={{ mr: 1.5 }} />
                    <Typography variant="body2">
                      Expires in {expiryTime}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
          
          {donation.notes && (
            <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
              <Box display="flex" alignItems="center" mb={1}>
                <NotesIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Donor Notes
                </Typography>
              </Box>
              <Typography variant="body2">
                {donation.notes}
              </Typography>
            </Box>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button 
            variant="contained"
            size="medium"
            onClick={() => handleDonationSelect(donation)}
            disabled={loading}
            startIcon={<CheckIcon />}
            sx={{
              minWidth: 180
            }}
          >
            Select Donation
          </Button>
        </CardActions>
      </Card>
    );
  }

  if (loading && !showMatches) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="300px"
        textAlign="center"
      >
        <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: 'primary.main' }} />
        <Typography variant="h6" color="text.secondary">
          {mode === 'create' ? 'Creating your request...' : 'Searching for matches...'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box 
        mb={4} 
        sx={{ 
          bgcolor: 'primary.light', 
          p: 3, 
          borderRadius: 2,
          background: theme => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main}20 100%)`
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom color="primary.dark">
          {mode === 'create' ? '🍲 Create Food Request' : '🔍 Find Donations'}
        </Typography>
        <Typography variant="body1" color="primary.dark" sx={{ opacity: 0.9 }}>
          {mode === 'create' 
            ? 'Fill out the form below to request food donations from local providers' 
            : 'Search for available food donations in your area'}
        </Typography>
      </Box>

      {/* Status Alerts */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {!showMatches ? (
        <Box 
          component="form" 
          onSubmit={mode === 'create' ? handleSubmit : handleFindMatches}
          noValidate
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required 
                error={!!errors.foodType}
                sx={{ mb: 2 }}
              >
                <InputLabel id="food-type-label">Food Type</InputLabel>
                <Select
                  labelId="food-type-label"
                  id="foodType"
                  name="foodType"
                  value={formData.foodType}
                  label="Food Type *"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {foodTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="quantity"
                name="quantity"
                label="Quantity (kg) *"
                type="text"
                value={formData.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                required={mode === 'create'}
                disabled={loading}
                error={!!errors.quantity}
                helperText={errors.quantity || 'Enter the amount in kilograms'}
                inputProps={{ 
                  inputMode: 'decimal',
                  pattern: '[0-9]*(\.[0-9]+)?',
                  min: 0.1,
                  step: 0.1,
                  maxLength: 10
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body2" color="text.secondary">
                        kg
                      </Typography>
                    </InputAdornment>
                  ),
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScaleIcon color={errors.quantity ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="urgency-label">Urgency Level</InputLabel>
                <Select
                  labelId="urgency-label"
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  label="Urgency Level"
                  onChange={handleChange}
                  disabled={loading}
                >
                  <MenuItem value="Low">
                    <Chip label="Low" color="success" size="small" sx={{ mr: 1 }} />
                    Not urgent
                  </MenuItem>
                  <MenuItem value="Medium">
                    <Chip label="Medium" color="warning" size="small" sx={{ mr: 1 }} />
                    Somewhat urgent
                  </MenuItem>
                  <MenuItem value="High">
                    <Chip label="High" color="error" size="small" sx={{ mr: 1 }} />
                    Very urgent
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Additional Notes"
                placeholder="Any special requirements or details about your request (e.g., dietary restrictions, pickup instructions)"
                value={formData.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                multiline
                rows={4}
                disabled={loading}
                error={!!errors.notes}
                helperText={errors.notes || `${formData.notes.length}/500 characters`}
                inputProps={{
                  maxLength: 500
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <NotesIcon color={errors.notes ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="location"
                name="location"
                label="Location *"
                value={formData.location}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={loading}
                error={!!errors.location}
                helperText={errors.location || 'Click the location icon to select on map'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon color={errors.location ? "error" : "action"} />
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
                sx={{ mb: 2 }}
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
              <Stack direction="row" justifyContent="space-between" mt={4}>

                <Button
                  onClick={onClose}
                  variant="outlined"
                  disabled={loading}
                  sx={{
                    px: 4,
                    py: 1.5
                  }}
                >
                  Cancel
                </Button>
                <Stack direction="row" spacing={2}>
                  {mode === 'create' && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleFindMatches}
                      disabled={loading || !formData.foodType || !formData.location}
                      startIcon={<SearchIcon />}
                      sx={{
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Find Matches First
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !formData.foodType || (mode === 'create' && !formData.quantity) || !formData.location}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    sx={{
                      px: 4,
                      py: 1.5,
                      minWidth: 180
                    }}
                  >
                    {loading 
                      ? 'Processing...' 
                      : mode === 'create' 
                        ? 'Create Request' 
                        : 'Find Matches'}
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h5" fontWeight="bold">
              {matches.length > 0 
                ? `Available Donations (${matches.length})`
                : 'No Matches Found'}
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowMatches(false)}
              disabled={loading}
              variant="outlined"
            >
              Back to {mode === 'create' ? 'Form' : 'Search'}
            </Button>
          </Box>

          {errors.matchingError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.matchingError}
            </Alert>
          )}

          {isFindingMatches ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : matches.length > 0 ? (
            <Box>
              {matches.map(renderDonationCard)}
            </Box>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2,
                my: 2
              }}
            >
              <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No matching donations found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                We couldn't find any donations matching your criteria. Try adjusting your search.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowMatches(false)}
                sx={{ mt: 2 }}
              >
                Modify Search Criteria
              </Button>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default RequestForm;