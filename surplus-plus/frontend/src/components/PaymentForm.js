import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import { 
  CreditCard as CreditCardIcon, 
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Fastfood as FoodIcon,
  Scale as ScaleIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import NotesIcon from '@mui/icons-material/Notes';
import { useAuth } from '../context/AuthContext';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';

const PaymentForm = ({ open, onClose, donation, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });

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

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update donation status to matched
      await axiosInstance.put(`${endpoints.donations.list}/${donation._id}`, {
        status: 'Matched',
        receiverId: user._id
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again or use a different payment method.');
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
                      {donation.foodType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Donation ID: {donation._id.slice(-6).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                
                <Stack spacing={2} mb={3}>
                  <Box display="flex" alignItems="center">
                    <ScaleIcon color="action" sx={{ mr: 2 }} />
                    <Typography variant="body1">
                      <strong>Quantity:</strong> {donation.quantity} kg
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <LocationIcon color="action" sx={{ mr: 2 }} />
                    <Typography variant="body1">
                      <strong>Pickup Location:</strong> {donation.location}
                    </Typography>
                  </Box>
                  {donation.notes && (
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
                  bgcolor: 'success.light',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Amount:
                  </Typography>
                  <Chip 
                    label="FREE" 
                    color="success"
                    size="medium"
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      px: 2
                    }}
                  />
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