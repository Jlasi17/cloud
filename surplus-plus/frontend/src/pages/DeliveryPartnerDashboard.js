import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  List,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Tab,
  Tabs
} from '@mui/material';
import { Link } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RoomIcon from '@mui/icons-material/Room';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../utils/axios';
import { endpoints, SOCKET_URL } from '../config/api';
import io from 'socket.io-client';

// Update location every 30 seconds
const LOCATION_UPDATE_INTERVAL = 30000;

const DeliveryPartnerDashboard = () => {
  const { user } = useAuth();
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return 'Address not specified';
    if (typeof location === 'string') return location;
    return location.address || 'Address not specified';
  };
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [openNotification, setOpenNotification] = useState(false);
  const [processingResponse, setProcessingResponse] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState(null);
  const trackingIntervalRef = useRef(null);
  const socketRef = useRef(null);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await axiosInstance.get(endpoints.delivery.matches, {
        params: {
          populate: 'donorId,receiverId' // or whatever your backend expects
        }
      });
      setAssignedDeliveries(response.data.assignedDeliveries || []);
      setAvailableDeliveries(response.data.availableDeliveries || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching deliveries',
        severity: 'error'
      });
    }
  }, []);

  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // Get address using reverse geocoding
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
      
      setLocation({
        coordinates: [longitude, latitude],
        address,
        timestamp: new Date().toLocaleTimeString()
      });
      
      setLocationError(null);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get your location. Please check permissions and try again.');
    }
  }, []);

  // Handle delivery status update
  const handleUpdateStatus = async (donationId, newStatus) => {
    try {
      setProcessingResponse(true);
      
      // Make the API request
      const response = await axiosInstance.post(endpoints.delivery.updateStatus, {
        donationId,
        status: newStatus
      });

      console.log('Status update response:', response.data);

      // Update the delivery in the assigned deliveries list
      setAssignedDeliveries(prev => prev.map(delivery => {
        if ((delivery._id === donationId) || (delivery.donationId === donationId)) {
          return {
            ...delivery,
            status: newStatus
          };
        }
        return delivery;
      }));

      // Show success message
      setSnackbar({
        open: true,
        message: 'Delivery status updated successfully',
        severity: 'success'
      });

      // Refresh matches to ensure sync with server
      await fetchMatches();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      console.error('Error details:', error.response?.data);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating delivery status',
        severity: 'error'
      });
    } finally {
      setProcessingResponse(false);
    }
  };

  const handleOpenDetails = useCallback((match) => {
    try {
      if (!match || !match._id) {
        throw new Error('Invalid match data: No match provided');
      }
      
      // Create a safe match object with default values
      const safeMatch = {
        ...match,
        // If you need to populate donor/receiver info, you might need to fetch it here
        // or ensure it's included in your initial data fetch
        donorId: match.donorId || {},
        receiverId: match.receiverId || {},
        _id: match._id
      };
      
      setSelectedMatch(safeMatch);
      setOpenDetails(true);
    } catch (error) {
      console.error('Error opening details:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to open delivery details. Please try again.',
        severity: 'error'
      });
    }
  }, []);

  const handleCloseDetails = useCallback(() => {
    setOpenDetails(false);
  }, []);

  // Handle delivery response (accept/decline)
  const handleDeliveryResponse = async (donationId, response) => {
    if (!donationId || !response) {
      console.error('Missing required parameters:', { donationId, response });
      return;
    }

    try {
      console.log('Handling delivery response:', { donationId, response });
      setProcessingResponse(true);

      // Optimistically update UI state
      if (response === 'accept') {
        // Remove from available deliveries immediately to prevent double-clicks
        setAvailableDeliveries(prev => prev.filter(d => 
          (d._id !== donationId) && (d.donationId !== donationId)
        ));
      }

      const result = await axiosInstance.post(endpoints.delivery.requestResponse, {
        donationId,
        response
      });

      console.log('Delivery response success:', result.data);

      // Update UI based on response type
      if (response === 'accept') {
        // Add to assigned deliveries
        const acceptedDelivery = result.data.donation;
        setAssignedDeliveries(prev => [...prev, acceptedDelivery]);
        
        setSnackbar({
          open: true,
          message: 'Delivery accepted successfully',
          severity: 'success'
        });
      } else {
        // For decline response
        setSnackbar({
          open: true,
          message: 'Delivery declined successfully',
          severity: 'info'
        });
      }

      // Refresh the lists to ensure consistency
      await fetchMatches();

    } catch (error) {
      console.error('Error responding to delivery request:', error);
      console.error('Error details:', error.response?.data);

      // Revert optimistic update if needed
      if (response === 'accept') {
        await fetchMatches(); // Refresh to get correct state
      }

      // Show appropriate error message
      let errorMessage = 'Error processing your response';
      if (error.response?.data?.message === 'This delivery has already been assigned to a delivery partner') {
        errorMessage = 'This delivery was already taken by another delivery partner';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setProcessingResponse(false);
    }
  };

  // Initialize location tracking
  useEffect(() => {
    const initTracking = async () => {
      try {
        await updateLocation();
        trackingIntervalRef.current = setInterval(updateLocation, LOCATION_UPDATE_INTERVAL);
      } catch (error) {
        console.error('Error initializing tracking:', error);
        setLocationError('Failed to initialize location tracking');
      }
    };

    initTracking();

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [updateLocation]);

  // Initialize data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMatches()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading dashboard data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Initialize socket connection
  useEffect(() => {
    let socket;
    try {
      // Connect to socket server with error handling
      socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000, // Add timeout
        forceNew: true // Force new connection
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to Socket.IO server with ID:', socket.id);
        setSnackbar({
          open: true,
          message: 'Connected to real-time updates',
          severity: 'success'
        });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setSnackbar({
          open: true,
          message: `Connection error: ${error.message}`,
          severity: 'error'
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          socket.connect();
        }
        setSnackbar({
          open: true,
          message: `Disconnected: ${reason}`,
          severity: 'warning'
        });
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt:', attemptNumber);
      });

      socket.on('reconnect_failed', () => {
        console.error('Failed to reconnect to Socket.IO server');
        setSnackbar({
          open: true,
          message: 'Failed to reconnect to real-time updates',
          severity: 'error'
        });
      });

      // Listen for new delivery requests
      socket.on('delivery_request', (data) => {
        console.log('Received delivery request:', data);
        // Only fetch matches if this response wasn't triggered by our own action
        if (data.deliveryPartnerId !== user.userId) {
          fetchMatches();
        }
      });

      // Listen for delivery response updates
      socket.on('delivery_response', (data) => {
        console.log('Received delivery response:', data);
        // Only fetch matches if this response wasn't triggered by our own action
        if (data.deliveryPartnerId !== user.userId) {
          fetchMatches();
        }
      });

      // Listen for delivery status updates
      socket.on('delivery_status_update', (data) => {
        console.log('Received status update:', data);
        // Only fetch matches if this update wasn't triggered by our own action
        if (data.deliveryPartnerId !== user.userId) {
          fetchMatches();
        }
      });

      return () => {
        if (socket) {
          console.log('Cleaning up socket connection');
          socket.disconnect();
        }
      };
    } catch (error) {
      console.error('Error setting up socket connection:', error);
      setSnackbar({
        open: true,
        message: 'Error setting up real-time updates',
        severity: 'error'
      });
    }
  }, [fetchMatches, user.userId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Render delivery action buttons with loading state
  const DeliveryActions = ({ delivery, onAccept, onDecline }) => {
    const isDisabled = Boolean(processingResponse || delivery.deliveryPartnerId);
    const deliveryId = delivery._id || delivery.donationId;
    
    return (
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleDeliveryResponse(deliveryId, 'accept')}
          disabled={isDisabled}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px 2px rgba(33, 203, 243, .4)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          {processingResponse ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Accept'
          )}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => handleDeliveryResponse(deliveryId, 'decline')}
          disabled={isDisabled}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          Decline
        </Button>
      </Box>
    );
  };

  const handleMarkAsDelivered = async (donationId) => {
    try {
      setProcessingResponse(true);
      
      // Update donation status
      const response = await axiosInstance.post(endpoints.delivery.updateStatus, {
        donationId,
        status: 'Delivered'
      });

      // Update the delivery in the assigned deliveries list
      setAssignedDeliveries(prev => prev.map(delivery => {
        if ((delivery._id === donationId) || (delivery.donationId === donationId)) {
          return {
            ...delivery,
            status: 'Delivered'
          };
        }
        return delivery;
      }));

      // Show success message
      setSnackbar({
        open: true,
        message: 'Delivery marked as completed successfully',
        severity: 'success'
      });

      // Close the details dialog
      setOpenDetails(false);

      // Refresh matches to ensure sync with server
      await fetchMatches();
    } catch (error) {
      console.error('Error marking delivery as completed:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error marking delivery as completed',
        severity: 'error'
      });
    } finally {
      setProcessingResponse(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh" gap={2}>
        <CircularProgress />
        <Typography>Loading your dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Delivery Partner Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<GpsFixedIcon />}
              sx={{ 
                height: 'fit-content',
                borderRadius: '20px',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px 2px rgba(33, 203, 243, .4)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Tracking Active
            </Button>
            <Tooltip title="Profile Settings">
              <IconButton 
                component={Link} 
                to="/delivery/profile"
                color="primary"
                aria-label="profile settings"
                sx={{ 
                  ml: 1,
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {locationError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
            {locationError}
          </Alert>
        )}
        
        {location && (
          <Card variant="outlined" sx={{ 
            mt: 2, 
            bgcolor: 'rgba(33, 150, 243, 0.05)',
            borderRadius: '15px',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              transform: 'translateY(-2px)'
            }
          }}>
            <CardContent sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center">
                <RoomIcon color="primary" sx={{ mr: 1.5, fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Current Location {location.timestamp && `(Updated: ${location.timestamp})`}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {location.address}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Coordinates: {location.coordinates.join(', ')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        '& .MuiTabs-root': {
          minHeight: '48px'
        },
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '1rem',
          minHeight: '48px',
          '&.Mui-selected': {
            color: 'primary.main',
            fontWeight: 600
          }
        }
      }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="delivery dashboard tabs">
          <Tab label={`My Deliveries (${assignedDeliveries.length})`} />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Available Requests
                {availableDeliveries.length > 0 && (
                  <Chip
                    label={availableDeliveries.length}
                    color="primary"
                    size="small"
                    sx={{ 
                      ml: 1,
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            My Deliveries
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {assignedDeliveries.length > 0 ? (
            <List>
              {assignedDeliveries.map((delivery) => (
                <Card key={delivery._id} sx={{ 
                  mb: 2,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                  }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flexGrow={1}>
                        <Typography variant="h6" component="div" sx={{ 
                          fontWeight: 600,
                          color: 'primary.main'
                        }}>
                          {delivery.foodType} ({delivery.quantity} kg)
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={3} mt={2}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>Pickup</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {delivery.donorId?.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatLocation(delivery.location)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>Delivery</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {delivery.receiverId?.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatLocation(delivery.receiverId?.location)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ 
                          mt: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          flexWrap: 'wrap', 
                          gap: 1.5 
                        }}>
                          <Chip 
                            label={delivery.status} 
                            size="small" 
                            color={
                              delivery.status === 'Delivered' ? 'success' : 
                              delivery.status === 'Ready to Pick Up' ? 'warning' : 
                              'primary'
                            }
                            sx={{ 
                              textTransform: 'capitalize',
                              fontWeight: 500,
                              '& .MuiChip-label': {
                                px: 1.5
                              }
                            }}
                          />
                          {delivery.status === 'Ready to Pick Up' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleUpdateStatus(delivery._id, 'In Progress')}
                              startIcon={<LocalShippingIcon />}
                              sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 500,
                                px: 2
                              }}
                            >
                              Start Pickup
                            </Button>
                          )}
                          <Button 
                            size="small" 
                            onClick={() => handleOpenDetails(delivery)}
                            startIcon={<InfoIcon />}
                            sx={{
                              borderRadius: '20px',
                              textTransform: 'none',
                              fontWeight: 500,
                              px: 2
                            }}
                          >
                            Details
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <Typography>No assigned deliveries at the moment.</Typography>
            </Box>
          )}
        </Paper>
      ) : (
        <Paper sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Available Delivery Requests
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {availableDeliveries.length > 0 ? (
            <Grid container spacing={3}>
              {availableDeliveries.map((delivery) => (
                <Grid item xs={12} key={delivery._id || delivery.donationId}>
                  <Card variant="outlined" sx={{ 
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flexGrow={1}>
                          <Typography variant="h6" component="div" sx={{ 
                            fontWeight: 600,
                            color: 'primary.main'
                          }}>
                            {delivery.foodType} ({delivery.quantity} kg)
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={4} mt={2}>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>Pickup</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {delivery.donorId?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatLocation(delivery.location)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>Delivery</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {delivery.receiverId?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatLocation(delivery.receiverId?.location)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box mt={2}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Estimated Value: ${delivery.estimatedValue}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Posted {new Date(delivery.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                          <DeliveryActions delivery={delivery} onAccept={handleDeliveryResponse} onDecline={handleDeliveryResponse} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <Typography>No available delivery requests at the moment.</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Delivery Details Dialog */}
      {openDetails && selectedMatch && (
        <Dialog 
          open={openDetails} 
          onClose={handleCloseDetails} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '15px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            '& .MuiTypography-root': {
              fontWeight: 600,
              fontSize: '1.5rem'
            }
          }}>
            Delivery Details
          </DialogTitle>
          <DialogContent>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>Order Summary</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Pickup Details</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Donor:</strong> {selectedMatch.donorId?.name || 'N/A'}</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Food Type:</strong> {selectedMatch.foodType || 'N/A'}</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Quantity:</strong> {selectedMatch.quantity || 0} kg</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Pickup Address:</strong> {selectedMatch.location || 'Not specified'}</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Pickup Time:</strong> {selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : 'N/A'}</Typography>
                    
                    {selectedMatch.coordinates?.lat && selectedMatch.coordinates?.lng && (
                      <Box mt={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RoomIcon />}
                          component="a"
                          href={`https://www.google.com/maps?q=${selectedMatch.coordinates.lat},${selectedMatch.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 2
                          }}
                        >
                          View on Map
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Delivery Details</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Recipient:</strong> {selectedMatch.receiverId?.name || 'N/A'}</Typography>
                    <Typography sx={{ fontWeight: 500 }}><strong>Delivery Address:</strong> {selectedMatch.deliveryAddress || 'Not specified'}</Typography>
                    <Box display="flex" alignItems="center" mt={1} mb={1}>
                      <Typography sx={{ fontWeight: 500 }}><strong>Status:</strong></Typography>
                      <Chip 
                        label={selectedMatch.status || 'pending'} 
                        size="small" 
                        color={
                          selectedMatch.status === 'Delivered' ? 'success' : 
                          selectedMatch.status === 'Ready to Pick Up' ? 'warning' : 'primary'
                        }
                        sx={{ 
                          ml: 1, 
                          textTransform: 'capitalize',
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 1.5
                          }
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 500 }}><strong>Assigned At:</strong> {selectedMatch.updatedAt ? new Date(selectedMatch.updatedAt).toLocaleString() : 'N/A'}</Typography>
                    
                    {selectedMatch.deliveryCoordinates?.lat && selectedMatch.deliveryCoordinates?.lng && (
                      <Box mt={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RoomIcon />}
                          component="a"
                          href={`https://www.google.com/maps?q=${selectedMatch.deliveryCoordinates.lat},${selectedMatch.deliveryCoordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 2
                          }}
                        >
                          View on Map
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Special Instructions</Typography>
                <Paper variant="outlined" sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  borderRadius: '12px',
                  borderColor: 'rgba(33, 150, 243, 0.2)'
                }}>
                  {selectedMatch.notes || 'No special instructions provided.'}
                </Paper>
              </Box>
              
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Delivery Route</Typography>
                {selectedMatch.location && selectedMatch.receiverId?.location ? (
                  <Box sx={{ 
                    height: '300px', 
                    width: '100%', 
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
                      <iframe
                        title="delivery-route"
                        width="100%"
                        height="300"
                        frameBorder="0"
                        style={{ border: '1px solid #ccc', borderRadius: '12px' }}
                        src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(selectedMatch.location)}&destination=${encodeURIComponent(selectedMatch.receiverId.location)}&mode=driving`}
                        allowFullScreen
                      />
                    ) : (
                      <Alert severity="warning" sx={{ mt: 1, borderRadius: '12px' }}>
                        Google Maps API key is not configured. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your environment variables.
                      </Alert>
                    )}
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 8, 
                      right: 8, 
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      p: 1, 
                      borderRadius: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': { 
                        bgcolor: 'rgba(255,255,255,1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      },
                      transition: 'all 0.3s ease'
                    }}>
                      <Link
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedMatch.location)}&destination=${encodeURIComponent(selectedMatch.receiverId.location)}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          textDecoration: 'none',
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}
                      >
                        <OpenInNewIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Open in Google Maps
                      </Link>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 1, borderRadius: '12px' }}>
                    {!selectedMatch.location && !selectedMatch.receiverId?.location && !selectedMatch.coordinates?.lat && !selectedMatch.receiverCoordinates?.lat
                      ? "Both pickup and delivery locations are missing"
                      : !selectedMatch.location && !selectedMatch.coordinates?.lat
                        ? "Pickup location is missing"
                        : "Delivery location is missing"}
                  </Alert>
                )}
              </Box>
              
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={handleCloseDetails}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 500,
                px: 2
              }}
            >
              Close
            </Button>
            {selectedMatch?.status !== 'Delivered' && (
              <>
                
                {selectedMatch?.status === 'In Progress' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleMarkAsDelivered(selectedMatch._id)}
                    disabled={processingResponse}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      borderRadius: '20px',
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {processingResponse ? 'Processing...' : 'Mark as Delivered'}
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Notification Dialog */}
      <Dialog
        open={openNotification}
        onClose={() => setOpenNotification(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '15px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          '& .MuiTypography-root': {
            fontWeight: 600,
            fontSize: '1.5rem'
          }
        }}>
          New Delivery Request
        </DialogTitle>
        <DialogContent>
          {notification && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>Delivery Details</Typography>
              <Typography sx={{ fontWeight: 500 }}><strong>Food Type:</strong> {notification.foodType}</Typography>
              <Typography sx={{ fontWeight: 500 }}><strong>Quantity:</strong> {notification.quantity}</Typography>
              <Typography sx={{ fontWeight: 500 }}><strong>Pickup Location:</strong> {notification.pickupAddress}</Typography>
              <Typography sx={{ fontWeight: 500 }}><strong>Delivery Location:</strong> {notification.deliveryAddress}</Typography>
              <Typography sx={{ fontWeight: 500 }}><strong>Estimated Value:</strong> ${notification.estimatedValue}</Typography>
              <Typography color="text.secondary" sx={{ mt: 2, fontWeight: 500 }}>
                Please accept or decline this delivery request.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenNotification(false)}
            color="inherit"
            disabled={processingResponse}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => handleDeliveryResponse(notification?.donationId, 'decline')}
            color="error"
            variant="outlined"
            startIcon={<CancelIcon />}
            disabled={processingResponse}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Decline
          </Button>
          <Button
            onClick={() => handleDeliveryResponse(notification?.donationId, 'accept')}
            color="success"
            variant="contained"
            startIcon={<CheckCircleIcon />}
            disabled={processingResponse}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
              boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar?.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar?.severity || 'info'}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DeliveryPartnerDashboard;
