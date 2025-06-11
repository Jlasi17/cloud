import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Divider,
  IconButton,
  CircularProgress,
  Chip,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Fade,
  Slide,
  Zoom,
  Grow,
  useScrollTrigger,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Restaurant as DonateIcon,
  RestaurantMenu as ReceiveIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CurrencyExchange as CostIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import DonationForm from '../components/DonationForm';
import RequestForm from '../components/RequestForm';
import PaymentForm from '../components/PaymentForm';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

// Custom Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Box>{children}</Box>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

// Status Chip Component
const StatusChip = ({ status }) => {
  const getStatusProps = () => {
    switch (status) {
      case 'Available':
      case 'Completed':
      case 'Matched':
        return { 
          icon: <CheckCircleIcon fontSize="small" />, 
          color: 'success',
          label: status
        };
      case 'Pending':
      case 'In Progress':
        return { 
          icon: <PendingIcon fontSize="small" />, 
          color: 'warning',
          label: status
        };
      case 'High':
      case 'Expired':
      case 'Cancelled':
        return { 
          icon: <ErrorIcon fontSize="small" />, 
          color: 'error',
          label: status
        };
      default:
        return { 
          icon: <InfoIcon fontSize="small" />, 
          color: 'info',
          label: status
        };
    }
  };

  const { icon, color, label } = getStatusProps();
  
  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size="small"
      sx={{ 
        fontWeight: 600,
        px: 1,
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
};

// Custom Card Component
const DashboardCard = ({ 
  title, 
  subtitle, 
  icon, 
  status, 
  details, 
  actions, 
  onClick,
  sx = {}
}) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        onClick={onClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom right, #ffffff, #f9f9f9)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px 0 rgba(0,0,0,0.1)',
          },
          ...sx,
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="h3" sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {icon && React.cloneElement(icon, { sx: { fontSize: '1.2rem' } })}
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {status && <StatusChip status={status} />}
          </Box>
          
          {details && (
            <Box sx={{ mt: 2 }}>
              {details.map((detail, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  '& svg': { 
                    mr: 1, 
                    color: 'text.secondary',
                    fontSize: '1.1rem',
                  }
                }}>
                  {detail.icon}
                  <Typography variant="body2" color="text.secondary">
                    {detail.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
        
        {actions && (
          <CardActions sx={{ 
            p: 0, 
            mt: 'auto',
            '& .MuiButton-root': {
              borderRadius: 0,
              py: 1.5,
              flex: 1,
              '&:first-of-type': {
                borderBottomLeftRadius: '12px',
              },
              '&:last-child': {
                borderBottomRightRadius: '12px',
              },
            },
          }}>
            {actions}
          </CardActions>
        )}
      </Card>
    </motion.div>
  );
};

// Stats Card Component
const StatCard = ({ icon, value, label, color }) => (
  <motion.div variants={itemVariants}>
    <Paper 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.9) 100%)',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <Box sx={{ 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: '50%',
        bgcolor: `${color}.light`,
        color: `${color}.dark`,
        mb: 2,
        '& svg': {
          fontSize: 30
        }
      }}>
        {icon}
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  </motion.div>
);

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for UI and data
  const [activeTab, setActiveTab] = useState(0);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);
  
  // Stats state
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeRequests: 0,
    completedDonations: 0,
    totalImpact: 0,
  });
  
  // Handle menu open/close
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsMenu = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Show success message
  const showSuccess = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  };
  
  // Show error message
  const showError = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error',
    });
  };
  
  const handleDonationSelect = (donation, request) => {
    setSelectedDonation(donation);
    setSelectedRequest(request);
    setOpenPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    fetchRequests();
    setOpenPaymentForm(false);
    showSuccess('Payment processed successfully!');
  };

  const handleRequestSuccess = () => {
    fetchRequests();
    setShowRequestForm(false);
    showSuccess('Request created successfully!');
  };
  
  const handleDonationSuccess = () => {
    fetchDonations();
    setShowDonationForm(false);
    showSuccess('Donation created successfully!');
  };

  const handleDeleteDonation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return;
    
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      await axiosInstance.delete(endpoints.donations.delete(id));
      await fetchDonations();
      showSuccess('Donation deleted successfully!');
    } catch (error) {
      console.error('Error deleting donation:', error);
      showError('Failed to delete donation');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      await axiosInstance.delete(endpoints.requests.delete(id));
      await fetchRequests();
      showSuccess('Request deleted successfully!');
    } catch (error) {
      console.error('Error deleting request:', error);
      showError('Failed to delete request');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowDonationForm(false);
    setShowRequestForm(false);
    setFormInitialized(false);
    
    if (tab === 'donate') {
      fetchDonations();
    } else if (tab === 'receive') {
      fetchRequests();
    }
  };
  
  // Toggle donation form visibility
  const toggleDonationForm = () => {
    setShowDonationForm(!showDonationForm);
    setFormInitialized(true);
  };
  
  // Toggle request form visibility
  const toggleRequestForm = () => {
    setShowRequestForm(!showRequestForm);
    setFormInitialized(true);
  };

  // Check token and refresh if needed
  const checkToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        return false;
      }
      return true;
    } catch (error) {
      setError('Failed to check session. Please try again.');
      return false;
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError('');

      // Check authentication first
      if (!await checkToken()) {
        navigate('/login');
        return;
      }

      const response = await axiosInstance.get(endpoints.donations.myDonations);
      
      if (!response.data || !Array.isArray(response.data.donations)) {
        throw new Error('Invalid response format from server');
      }

      setDonations(response.data.donations);
      setStats({
        totalDonations: response.data.donations.length,
        completedDonations: response.data.donations.filter(d => d.status === 'Completed').length,
        activeRequests: requests.length,
        totalImpact: response.data.donations.reduce((sum, d) => sum + (parseFloat(d.quantity) || 1), 0),
      });
    } catch (error) {
      console.error('Error fetching donations:', error);
      
      let errorMessage = 'Failed to fetch donations. ';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        switch (error.response.status) {
          case 401:
            errorMessage += 'Please log in again.';
            navigate('/login');
            break;
          case 403:
            errorMessage += 'You do not have permission to view these donations.';
            break;
          case 404:
            errorMessage += 'No donations found.';
            break;
          case 500:
            errorMessage += 'Server error. Please try again later.';
            break;
          default:
            errorMessage += error.response.data?.message || 'Please try again.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage += 'No response from server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += error.message || 'An unexpected error occurred.';
      }
      
      showError(errorMessage);
      setDonations([]);
      setStats({
        totalDonations: 0,
        completedDonations: 0,
        activeRequests: 0,
        totalImpact: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (!await checkToken()) return;
      const response = await axiosInstance.get(endpoints.requests.list);
      setRequests(response.data.requests);
      setStats(prev => ({
        ...prev,
        activeRequests: response.data.requests.length,
      }));
    } catch (error) {
      showError('Failed to fetch requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (activeTab === 'donate') {
      fetchDonations();
    } else if (activeTab === 'receive') {
      fetchRequests();
    }
  }, [user, navigate, activeTab]);

  return (
    <Box sx={{ 
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #e4e8eb 100%)',
      minHeight: '100vh',
      pb: 6
    }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h3" component="h1" sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  color: 'text.primary',
                  background: 'linear-gradient(to right, #3f51b5, #2196f3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Welcome back, {user?.name}!
                </Typography>
                <Typography variant="h6" component="h2" color="text.secondary" sx={{ mb: 3 }}>
                  {activeTab === 'donate' ? 
                    "Your generous donations make a difference" : 
                    "Find the food you need in your community"}
                </Typography>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ height: '100%' }}
              >
                <Paper sx={{ 
                  p: 3, 
                  height: '100%',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.9) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={activeTab === 'donate' ? 'contained' : 'outlined'}
                      color="primary"
                      startIcon={<DonateIcon />}
                      onClick={() => handleTabChange('donate')}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        letterSpacing: 0.5,
                        boxShadow: activeTab === 'donate' ? '0 4px 12px rgba(63, 81, 181, 0.3)' : 'none',
                      }}
                    >
                      Donate Food
                    </Button>
                    <Button
                      variant={activeTab === 'receive' ? 'contained' : 'outlined'}
                      color="secondary"
                      startIcon={<ReceiveIcon />}
                      onClick={() => handleTabChange('receive')}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        letterSpacing: 0.5,
                        boxShadow: activeTab === 'receive' ? '0 4px 12px rgba(156, 39, 176, 0.3)' : 'none',
                      }}
                    >
                      Receive Food
                    </Button>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Box>

        {/* Stats Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
            <Grid item xs={10} sm={5} md={4} lg={3}>
              <StatCard 
                icon={<DonateIcon />}
                value={stats.totalDonations}
                label="Total Donations"
                color="primary"
              />
            </Grid>
            <Grid item xs={10} sm={5} md={4} lg={3}>
              <StatCard 
                icon={<ReceiveIcon />}
                value={stats.activeRequests}
                label="Active Requests"
                color="secondary"
              />
            </Grid>
          </Grid>
        </motion.div>

        {/* Main Content */}
        <Paper sx={{ 
          p: { xs: 2, md: 4 },
          borderRadius: 3,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          mb: 4
        }}>
          {activeTab === 'donate' && (
            <>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Typography variant="h4" component="h2" sx={{ 
                  fontWeight: 600,
                  color: 'primary.main'
                }}>
                  Your Food Donations
                </Typography>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={toggleDonationForm}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      letterSpacing: 0.5,
                      boxShadow: '0 4px 12px rgba(63, 81, 181, 0.2)',
                    }}
                  >
                    {showDonationForm ? 'Hide Form' : 'New Donation'}
                  </Button>
                </motion.div>
              </Box>
              
              {showDonationForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ 
                    mb: 4, 
                    p: 3, 
                    borderRadius: 2,
                    background: 'rgba(63, 81, 181, 0.03)',
                    border: '1px solid rgba(63, 81, 181, 0.1)'
                  }}>
                    <DonationForm 
                      open={showDonationForm}
                      onClose={toggleDonationForm} 
                      onSuccess={handleDonationSuccess}
                    />
                  </Box>
                </motion.div>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={60} thickness={4} color="primary" />
                </Box>
              ) : donations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    background: 'linear-gradient(to bottom right, #f5f7fa, #e4e8eb)',
                    borderRadius: 3
                  }}>
                    <DonateIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      No Donations Yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      You haven't created any food donations yet. Start by clicking the "New Donation" button above.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={toggleDonationForm}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontWeight: 600
                      }}
                    >
                      Create First Donation
                    </Button>
                  </Paper>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Grid container spacing={3}>
                    {donations.map((donation) => (
                      <Grid item xs={12} sm={6} md={4} key={donation._id}>
                        <motion.div variants={itemVariants}>
                          <DashboardCard
                            title={donation.foodType}
                            status={donation.status}
                            icon={<DonateIcon color="primary" />}
                            details={[
                              { icon: <TimeIcon />, text: `Expires in: ${donation.estimatedSpoilTime}` },
                              { icon: <LocationIcon />, text: donation.location },
                              { icon: <CostIcon />, text: `Market Cost: ${donation.marketCost}` }
                            ]}
                            actions={
                              <>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDonation(donation._id);
                                  }}
                                  disabled={deleteLoading[donation._id]}
                                  startIcon={deleteLoading[donation._id] ? <CircularProgress size={16} /> : <DeleteIcon />}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: 'error.main',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  {deleteLoading[donation._id] ? 'Deleting' : 'Delete'}
                                </Button>
                              </>
                            }
                            sx={{
                              '&:hover': {
                                borderColor: 'primary.light',
                              }
                            }}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              )}
            </>
          )}

          {activeTab === 'receive' && (
            <>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Typography variant="h4" component="h2" sx={{ 
                  fontWeight: 600,
                  color: 'secondary.main'
                }}>
                  Your Food Requests
                </Typography>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={toggleRequestForm}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      letterSpacing: 0.5,
                      boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)',
                    }}
                  >
                    {showRequestForm ? 'Hide Form' : 'New Request'}
                  </Button>
                </motion.div>
              </Box>
              
              {showRequestForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ 
                    mb: 4, 
                    p: 3, 
                    borderRadius: 2,
                    background: 'rgba(156, 39, 176, 0.03)',
                    border: '1px solid rgba(156, 39, 176, 0.1)'
                  }}>
                    <RequestForm 
                      onClose={toggleRequestForm}
                      onSuccess={handleRequestSuccess}
                      onDonationSelect={handleDonationSelect}
                      initialData={selectedRequest}
                    />
                  </Box>
                </motion.div>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={60} thickness={4} color="secondary" />
                </Box>
              ) : requests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    background: 'linear-gradient(to bottom right, #f5f7fa, #e4e8eb)',
                    borderRadius: 3
                  }}>
                    <ReceiveIcon sx={{ fontSize: 60, color: 'secondary.light', mb: 2 }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      No Requests Yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      You haven't created any food requests yet. Start by clicking the "New Request" button above.
                    </Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<AddIcon />}
                      onClick={toggleRequestForm}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontWeight: 600
                      }}
                    >
                      Create First Request
                    </Button>
                  </Paper>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Grid container spacing={3}>
                    {requests.map((request) => (
                      <Grid item xs={12} sm={6} md={4} key={request._id}>
                        <motion.div variants={itemVariants}>
                          <DashboardCard
                            title={request.foodType}
                            status={request.status}
                            subtitle={`Urgency: ${request.urgency}`}
                            icon={<ReceiveIcon color="secondary" />}
                            details={[
                              { icon: <LocationIcon />, text: request.location },
                              { 
                                icon: <WarningIcon color={request.urgency === 'High' ? 'error' : request.urgency === 'Medium' ? 'warning' : 'success'} />, 
                                text: `Urgency: ${request.urgency}`
                              }
                            ]}
                            actions={
                              <>
                                <Button
                                  size="small"
                                  color="secondary"
                                  variant="contained"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRequestForm(true);
                                  }}
                                  sx={{
                                    flex: 2,
                                    '&:hover': {
                                      bgcolor: 'secondary.dark',
                                    },
                                  }}
                                >
                                  Find Matches
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRequest(request._id);
                                  }}
                                  disabled={deleteLoading[request._id]}
                                  startIcon={deleteLoading[request._id] ? <CircularProgress size={16} /> : <DeleteIcon />}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: 'error.main',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  {deleteLoading[request._id] ? 'Deleting' : 'Delete'}
                                </Button>
                              </>
                            }
                            sx={{
                              '&:hover': {
                                borderColor: 'secondary.light',
                              }
                            }}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              )}
            </>
          )}
        </Paper>
      </Container>

      {/* Payment Dialog */}
      <PaymentForm
        open={openPaymentForm}
        onClose={() => setOpenPaymentForm(false)}
        donation={selectedDonation}
        request={selectedRequest}
        onSuccess={handlePaymentSuccess}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />,
            warning: <WarningIcon fontSize="inherit" />,
            info: <InfoIcon fontSize="inherit" />,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}