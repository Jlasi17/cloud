import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';

const DeliveryProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [profile, setProfile] = useState({
    costPerKm: 10,
    location: {
      coordinates: [0, 0],
      address: ''
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(endpoints.delivery.profile);
        if (response.data) {
          setProfile({
            costPerKm: response.data.costPerKm || 10,
            location: response.data.location || {
              coordinates: [0, 0],
              address: ''
            }
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load profile',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationUpdate = async () => {
    if (!navigator.geolocation) {
      setSnackbar({
        open: true,
        message: 'Geolocation is not supported by your browser',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Reverse geocoding to get address
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.display_name || 'Location updated';
      
      // Update location in the backend
      await axiosInstance.post(endpoints.delivery.location, {
        longitude,
        latitude,
        address
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        location: {
          coordinates: [longitude, latitude],
          address
        }
      }));

      setSnackbar({
        open: true,
        message: 'Location updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating location:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update location',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axiosInstance.put(endpoints.delivery.updateProfile, {
        costPerKm: parseFloat(profile.costPerKm)
      });
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const handleGoBack = () => {
    navigate('/delivery/dashboard');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Tooltip title="Back to Dashboard">
          <IconButton 
            onClick={handleGoBack} 
            sx={{ mr: 2 }}
            aria-label="back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" component="h1">
          Delivery Partner Profile
        </Typography>
      </Box>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Your Location
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Current Location:</strong> {profile.location?.address || 'Not set'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Coordinates: {profile.location?.coordinates?.join(', ') || 'N/A'}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleLocationUpdate}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Updating...' : 'Update My Location'}
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Note: Your location will be used to track your position during deliveries.
              Make sure to keep this updated for accurate tracking.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Preferences
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <TextField
              fullWidth
              margin="normal"
              label="Cost per Kilometer (INR)"
              name="costPerKm"
              type="number"
              value={profile.costPerKm}
              onChange={handleInputChange}
              inputProps={{ min: 1, step: 1 }}
              required
              helperText="Set your rate per kilometer for delivery"
            />
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : null}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DeliveryProfile;
