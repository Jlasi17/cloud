import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  Paper,
  Avatar,
  Chip,
  Stack
} from '@mui/material';
import { 
  CreditCard as CreditCardIcon, 
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Fastfood as FoodIcon,
  Scale as ScaleIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';

const PaymentForm = ({ open, onClose, donation, request, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: user?.name || ''
  });

  useEffect(() => {
    const calculatePrice = async () => {
      if (!donation) return;

      try {
        const response = await axiosInstance.post(
          endpoints.donations.calculatePrice,
          {
            donationId: donation._id
          }
        );
        setCalculatedPrice(response.data);
      } catch (error) {
        console.error('Error calculating price:', error);
        setError('Failed to calculate price. Please try again.');
      }
    };

    calculatePrice();
  }, [donation]);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    }
    return value;
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardDetails(prev => ({
      ...prev,
      cardNumber: formattedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate card details
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardHolder) {
        throw new Error('Please fill in all card details');
      }

      if (!donation || !donation._id) {
        throw new Error('Invalid donation selected');
      }

      if (!user || !user._id) {
        throw new Error('You must be logged in to complete this action');
      }

      // Validate donation status first
      const donationId = donation._id.toString();
      const checkResponse = await axiosInstance.get(`${endpoints.donations.list}/${donationId}`);
      const currentDonation = checkResponse.data;
      
      if (!currentDonation) {
        throw new Error('Donation no longer exists');
      }

      if (currentDonation.status !== 'Available') {
        throw new Error('This donation is no longer available');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update donation status to In Progress
      const updateResponse = await axiosInstance.put(
        endpoints.donations.update(donationId),
        {
          status: 'In Progress',
          receiverId: user._id
        }
      );

      if (!updateResponse.data?.donation) {
        throw new Error('Failed to update donation status');
      }

      // Create a transaction record
      await axiosInstance.post(endpoints.transactions.create, {
        donationId: donationId,
        donorId: donation.donorId,
        receiverId: user._id,
        amount: donation.marketCost,
        status: 'In Progress',
        paymentMethod: 'Card'
      });

      // Mark the associated request as in progress if it exists
      if (request?._id) {
        await axiosInstance.put(
          endpoints.requests.update(request._id),
          {
            status: 'In Progress',
            donorId: donation.donorId,
            donationId: donationId
          }
        );
      }

      if (onSuccess) {
        onSuccess(updateResponse.data.donation);
      }
      onClose();
    } catch (err) {
      console.error('Payment failed:', err);
      let errorMessage = 'Payment failed. ';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        switch (err.response.status) {
          case 400:
            errorMessage += err.response.data?.message || 'Invalid request data.';
            break;
          case 401:
            errorMessage += 'Please log in again.';
            // Redirect to login if token is invalid
            window.location.href = '/login';
            break;
          case 403:
            errorMessage += 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage += 'Donation not found.';
            break;
          case 500:
            errorMessage += 'Server error. Please try again later.';
            break;
          default:
            errorMessage += err.response.data?.message || 'Please try again.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request
        errorMessage += err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!donation) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        py: 3,
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <Box display="flex" alignItems="center">
          <PaymentIcon sx={{ mr: 2 }} />
          <Typography variant="h6" fontWeight="bold">
            Complete Your Donation
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ py: 4 }}>
          <Grid container spacing={4}>
            {/* Donation Summary Column */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ 
                p: 3, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Donation Summary
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.light', 
                    mr: 2,
                    color: 'primary.main'
                  }}>
                    <FoodIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {donation?.foodType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Donation ID: {donation?._id?.slice(-6).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={2} mb={3}>
                  <Box display="flex" alignItems="center">
                    <ScaleIcon color="action" sx={{ mr: 2 }} />
                    <Typography variant="body1">
                      <strong>Quantity:</strong> {donation?.quantity} kg
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <LocationIcon color="action" sx={{ mr: 2 }} />
                    <Typography variant="body1">
                      <strong>Pickup Location:</strong> {donation?.location}
                    </Typography>
                  </Box>
                  {donation?.notes && (
                    <Box display="flex" alignItems="flex-start">
                      <NotesIcon color="action" sx={{ mr: 2, mt: 0.5 }} />
                      <Typography variant="body1">
                        <strong>Notes:</strong> {donation.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ 
                  p: 2,
                  bgcolor: calculatedPrice?.finalPrice > 0 ? 'primary.light' : 'success.light',
                  borderRadius: 1,
                }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Price Breakdown:
                  </Typography>
                  {calculatedPrice ? (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Original Price:</Typography>
                        <Typography variant="body2">₹{calculatedPrice.originalPrice}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Time Discount:</Typography>
                        <Typography variant="body2">{calculatedPrice.priceBreakdown.timeDiscount}%</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Quantity Discount:</Typography>
                        <Typography variant="body2">{calculatedPrice.priceBreakdown.quantityDiscount}%</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Food Type Factor:</Typography>
                        <Typography variant="body2">{calculatedPrice.priceBreakdown.foodTypeMultiplier}%</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight="bold">
                          Final Price:
                        </Typography>
                        <Chip 
                          label={calculatedPrice.finalPrice > 0 ? `₹${calculatedPrice.finalPrice}` : 'FREE'} 
                          color={calculatedPrice.finalPrice > 0 ? 'primary' : 'success'}
                          size="medium"
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            px: 2
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mt={1} textAlign="center">
                        Total Discount: {calculatedPrice.discountPercentage}%
                      </Typography>
                    </>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
            
            {/* Payment Form Column */}
            <Grid item xs={12} md={7}>
              <Box mb={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Payment Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Secure payment processed with SSL encryption
                </Typography>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ 
                p: 3, 
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                mb: 3
              }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <PaymentIcon color="primary" sx={{ mr: 1.5 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Credit/Debit Card
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="Card Number"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  required
                  margin="normal"
                  inputProps={{ maxLength: 19 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CreditCardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expiration Date"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleCardChange}
                      placeholder="MM/YY"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon color="action" />
                          </InputAdornment>
                        ),
                        inputProps: { maxLength: 5 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleCardChange}
                      placeholder="•••"
                      required
                      type="password"
                      inputProps={{ maxLength: 4 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                
                <TextField
                  fullWidth
                  label="Cardholder Name"
                  name="cardHolder"
                  value={cardDetails.cardHolder}
                  onChange={handleCardChange}
                  placeholder="As shown on card"
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mt: 3 }}
                />
              </Box>
              
              <Box sx={{ 
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'divider'
              }}>
                <Typography variant="body2" color="text.secondary">
                  <LockIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Your payment information is encrypted and secure. We do not store your card details.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between'
        }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            variant="outlined"
            sx={{
              px: 4,
              py: 1,
              minWidth: 120
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              px: 4,
              py: 1,
              minWidth: 200,
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Processing Payment...' : 'Confirm Donation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm;