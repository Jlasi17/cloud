import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';

const DeliveryPartnerDashboard = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(endpoints.matches.getDeliveryMatches);
      setMatches(response.data.matches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (matchId) => {
    try {
      await axiosInstance.post(endpoints.matches.acceptMatch, {
        matchId,
        deliveryPartnerId: user._id,
      });
      fetchMatches();
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  const handleUpdateStatus = async (matchId, status) => {
    try {
      await axiosInstance.post(endpoints.matches.updateStatus, {
        matchId,
        status,
      });
      fetchMatches();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleOpenDetails = (match) => {
    setSelectedMatch(match);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
  };

  const renderStatusChip = (status) => {
    const statusColors = {
      pending: 'default',
      assigned: 'primary',
      picked: 'secondary',
      delivered: 'success',
      cancelled: 'error',
    };

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={statusColors[status] || 'default'}
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  const renderDetailsDialog = () => (
    <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
      {selectedMatch && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <LocalShippingIcon color="primary" sx={{ mr: 1 }} />
              Delivery Details
              {renderStatusChip(selectedMatch.status)}
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Donor Section */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Donor Information</Typography>
                </Box>
                <Box sx={{ pl: 4 }}>
                  <Typography><strong>Name:</strong> {selectedMatch.donorId?.name || 'N/A'}</Typography>
                  <Typography><strong>Contact:</strong> {selectedMatch.donorId?.phone || 'N/A'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LocationOnIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedMatch.donorId?.address || 'Address not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Receiver Section */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Receiver Information</Typography>
                </Box>
                <Box sx={{ pl: 4 }}>
                  <Typography><strong>Name:</strong> {selectedMatch.requesterId?.name || 'N/A'}</Typography>
                  <Typography><strong>Contact:</strong> {selectedMatch.requesterId?.phone || 'N/A'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LocationOnIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedMatch.requesterId?.address || 'Address not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Food Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Food Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Typography>{selectedMatch.foodType}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Quantity</Typography>
                    <Typography>{selectedMatch.quantity} kg</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Box>{renderStatusChip(selectedMatch.status)}</Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Distance</Typography>
                    <Typography>~5.2 km</Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Special Instructions */}
              {selectedMatch.specialInstructions && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Special Instructions:
                  </Typography>
                  <Typography variant="body2">
                    {selectedMatch.specialInstructions}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
            {selectedMatch.status === 'pending' && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  handleAcceptMatch(selectedMatch._id);
                  handleCloseDetails();
                }}
              >
                Accept Delivery
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Delivery Partner Dashboard
      </Typography>

      {/* Current Delivery */}
      {currentDelivery ? (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Delivery
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Donor Details
                  </Typography>
                  <Typography>
                    Name: {currentDelivery.donor.name}
                  </Typography>
                  <Typography>
                    Location: {currentDelivery.donor.location}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Receiver Details
                  </Typography>
                  <Typography>
                    Name: {currentDelivery.receiver.name}
                  </Typography>
                  <Typography>
                    Location: {currentDelivery.receiver.location}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Food Details
                  </Typography>
                  <Typography>
                    Type: {currentDelivery.foodType}
                  </Typography>
                  <Typography>
                    Quantity: {currentDelivery.quantity}
                  </Typography>
                  <Typography>
                    Status: {currentDelivery.status}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleUpdateStatus(currentDelivery._id, 'picked')}
                    disabled={currentDelivery.status !== 'assigned'}
                  >
                    Picked Up
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleUpdateStatus(currentDelivery._id, 'delivered')}
                    disabled={currentDelivery.status !== 'picked'}
                  >
                    Delivered
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            No Current Delivery
          </Typography>
          <Typography color="text.secondary">
            You don't have any active deliveries at the moment.
          </Typography>
        </Paper>
      )}

      {/* Available Matches */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Matches
        </Typography>
        <List>
          {matches.map((match) => (
            <ListItem
              key={match._id}
              secondaryAction={
                <Box>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(match);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptMatch(match._id);
                    }}
                    disabled={match.status !== 'pending'}
                  >
                    {match.status === 'pending' ? 'Accept' : 'Accepted'}
                  </Button>
                </Box>
              }
            >
              <ListItemAvatar>
                <Avatar>
                  {match.foodType.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${match.quantity} ${match.foodType}`}
                secondary={`From: ${match.donorId.name} - To: ${match.requesterId.name}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      {renderDetailsDialog()}
    </Container>
  );
};

export default DeliveryPartnerDashboard;
