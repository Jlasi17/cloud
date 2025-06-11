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
      const response = await axiosInstance.get(endpoints.matches.getDeliveryMatches);
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
        donation: match.donation || {},
        donor: match.donor || {},
        requester: match.requester || {},
        _id: match._id
      };
      
      setSelectedMatch(safeMatch);
      setOpenDetails(true);
    } catch (error) {
      console.error('Error opening details:', error);
      setLocationError(error.message || 'Failed to open delivery details. Please try again.');
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
        reconnectionDelay: 1000
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setSnackbar({
          open: true,
          message: 'Connected to real-time updates',
          severity: 'success'
        });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setSnackbar({
          open: true,
          message: 'Error connecting to real-time updates',
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
    // Convert to boolean to ensure proper prop type
    const isDisabled = Boolean(processingResponse || delivery.deliveryPartnerId);
    const deliveryId = delivery._id || delivery.donationId;
    
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleDeliveryResponse(deliveryId, 'accept')}
          
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

        >
          Decline
        </Button>
      </Box>
    );
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
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Delivery Partner Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<GpsFixedIcon />}
              sx={{ height: 'fit-content' }}
            >
              Tracking Active
            </Button>
            <Tooltip title="Profile Settings">
              <IconButton 
                component={Link} 
                to="/delivery/profile"
                color="inherit"
                aria-label="profile settings"
                sx={{ ml: 1 }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {locationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {locationError}
          </Alert>
        )}
        
        {location && (
          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'action.hover' }}>
            <CardContent sx={{ py: 1 }}>
              <Box display="flex" alignItems="center">
                <RoomIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Location {location.timestamp && `(Updated: ${location.timestamp})`}
                  </Typography>
                  <Typography variant="body2">
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
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
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            My Deliveries
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {assignedDeliveries.length > 0 ? (
            <List>
              {assignedDeliveries.map((delivery) => (
                <Card key={delivery._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flexGrow={1}>
                        <Typography variant="h6" component="div">
                          {delivery.foodType} ({delivery.quantity} kg)
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Pickup</Typography>
                            <Typography variant="body2">
                              {delivery.donorId?.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatLocation(delivery.location)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Delivery</Typography>
                            <Typography variant="body2">
                              {delivery.receiverId?.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatLocation(delivery.receiverId?.location)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Chip 
                            label={delivery.status} 
                            size="small" 
                            color={
                              delivery.status === 'Delivered' ? 'success' : 
                              delivery.status === 'Ready to Pick Up' ? 'warning' : 
                              'primary'
                            }
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {delivery.status === 'Ready to Pick Up' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleUpdateStatus(delivery._id, 'In Progress')}
                              startIcon={<LocalShippingIcon />}
                            >
                              Start Pickup
                            </Button>
                          )}
                          <Button 
                            size="small" 
                            onClick={() => handleOpenDetails(delivery)}
                            startIcon={<InfoIcon />}
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
            <Typography>No assigned deliveries at the moment.</Typography>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Available Delivery Requests
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {availableDeliveries.length > 0 ? (
            <Grid container spacing={3}>
              {availableDeliveries.map((delivery) => (
                <Grid item xs={12} key={delivery._id || delivery.donationId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flexGrow={1}>
                          <Typography variant="h6" component="div">
                            {delivery.foodType} ({delivery.quantity} kg)
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={4} mt={2}>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Pickup</Typography>
                              <Typography variant="body2">
                                {delivery.donorId?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatLocation(delivery.location)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">Delivery</Typography>
                              <Typography variant="body2">
                                {delivery.receiverId?.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatLocation(delivery.receiverId?.location)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box mt={2}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Estimated Value: ${delivery.estimatedValue}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Posted {new Date(delivery.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <DeliveryActions delivery={delivery} onAccept={handleDeliveryResponse} onDecline={handleDeliveryResponse} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No available delivery requests at the moment.</Typography>
          )}
        </Paper>
      )}

      {/* Delivery Details Dialog - Only render if we have valid data */}
      {openDetails && selectedMatch && (
        <Dialog 
          open={openDetails} 
          onClose={handleCloseDetails} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Delivery Details</DialogTitle>
          <DialogContent>
            {/* Safe access to properties with optional chaining */}
            <Box>
              <Typography variant="h6" gutterBottom>Order Summary</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Pickup Details</Typography>
                  <Typography><strong>Donor:</strong> {selectedMatch.donor?.name || 'N/A'}</Typography>
                  <Typography><strong>Food Type:</strong> {selectedMatch.donation?.foodType || 'N/A'}</Typography>
                  <Typography><strong>Quantity:</strong> {selectedMatch.donation?.quantity || 0} kg</Typography>
                  <Typography><strong>Pickup Address:</strong> {selectedMatch.donation?.pickupAddress || 'Not specified'}</Typography>
                  <Typography><strong>Pickup Time:</strong> {selectedMatch.createdAt ? new Date(selectedMatch.createdAt).toLocaleString() : 'N/A'}</Typography>
                  
                  {selectedMatch.donation?.pickupLat && selectedMatch.donation?.pickupLng && (
                    <Box mt={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RoomIcon />}
                        component="a"
                        href={`https://www.google.com/maps?q=${selectedMatch.donation.pickupLat},${selectedMatch.donation.pickupLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Map
                      </Button>
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Delivery Details</Typography>
                  <Typography><strong>Recipient:</strong> {selectedMatch.requester?.name || 'N/A'}</Typography>
                  <Typography><strong>Delivery Address:</strong> {selectedMatch.deliveryAddress || 'Not specified'}</Typography>
                  <Box display="flex" alignItems="center" mt={1} mb={1}>
                    <Typography><strong>Status:</strong></Typography>
                    <Chip 
                      label={selectedMatch.status || 'pending'} 
                      size="small" 
                      color={
                        selectedMatch.status === 'delivered' ? 'success' : 
                        selectedMatch.status === 'picked' ? 'secondary' : 'primary'
                      }
                      sx={{ ml: 1, textTransform: 'capitalize' }}
                    />
                  </Box>
                  <Typography><strong>Assigned At:</strong> {selectedMatch.updatedAt ? new Date(selectedMatch.updatedAt).toLocaleString() : 'N/A'}</Typography>
                  
                  {selectedMatch.deliveryLat && selectedMatch.deliveryLng && (
                    <Box mt={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RoomIcon />}
                        component="a"
                        href={`https://www.google.com/maps?q=${selectedMatch.deliveryLat},${selectedMatch.deliveryLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Map
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
              
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>Special Instructions</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  {selectedMatch.donation?.notes || 'No special instructions provided.'}
                </Paper>
              </Box>
              
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>Delivery Route</Typography>
                {selectedMatch.donation?.pickupLat && selectedMatch.donation?.pickupLng && 
                selectedMatch.deliveryLat && selectedMatch.deliveryLng ? (
                  <iframe
                    title="delivery-route"
                    width="100%"
                    height="300"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(selectedMatch.donation.pickupLng, selectedMatch.deliveryLng) - 0.05}%2C${Math.min(selectedMatch.donation.pickupLat, selectedMatch.deliveryLat) - 0.05}%2C${Math.max(selectedMatch.donation.pickupLng, selectedMatch.deliveryLng) + 0.05}%2C${Math.max(selectedMatch.donation.pickupLat, selectedMatch.deliveryLat) + 0.05}&amp;layer=mapnik&marker=${selectedMatch.donation.pickupLat}%2C${selectedMatch.donation.pickupLng}&marker=${selectedMatch.deliveryLat}%2C${selectedMatch.deliveryLng}`}
                    style={{ border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                ) : (
                  <Typography color="text.secondary">Location data not available for route mapping.</Typography>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
            {selectedMatch?.status !== 'delivered' && (
              <Button 
                variant="contained" 
                color="primary"
                component="a"
                href={`https://www.google.com/maps/dir/?api=1&origin=${location?.coordinates?.[1] || ''},${location?.coordinates?.[0] || ''}&destination=${selectedMatch?.status === 'picked' ? selectedMatch.deliveryLat || selectedMatch.deliveryLng ? `${selectedMatch.deliveryLat},${selectedMatch.deliveryLng}` : '' : selectedMatch.donation?.pickupLat || selectedMatch.donation?.pickupLng ? `${selectedMatch.donation.pickupLat},${selectedMatch.donation.pickupLng}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<RoomIcon />}
              >
                Get Directions
              </Button>
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
      >
        <DialogTitle>New Delivery Request</DialogTitle>
        <DialogContent>
          {notification && (
            <Box>
              <Typography variant="h6" gutterBottom>Delivery Details</Typography>
              <Typography><strong>Food Type:</strong> {notification.foodType}</Typography>
              <Typography><strong>Quantity:</strong> {notification.quantity}</Typography>
              <Typography><strong>Pickup Location:</strong> {notification.pickupAddress}</Typography>
              <Typography><strong>Delivery Location:</strong> {notification.deliveryAddress}</Typography>
              <Typography><strong>Estimated Value:</strong> ${notification.estimatedValue}</Typography>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
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
          >
            Close
          </Button>
          <Button
            onClick={() => handleDeliveryResponse(notification?.donationId, 'decline')}
            color="error"
            variant="outlined"
            startIcon={<CancelIcon />}
            disabled={processingResponse}
          >
            Decline
          </Button>
          <Button
            onClick={() => handleDeliveryResponse(notification?.donationId, 'accept')}
            color="success"
            variant="contained"
            startIcon={<CheckCircleIcon />}
            disabled={processingResponse}
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
          sx={{ width: '100%' }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DeliveryPartnerDashboard;
