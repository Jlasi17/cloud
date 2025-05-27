import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock as LockIcon,
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  DeliveryDining as DeliveryIcon
} from '@mui/icons-material';

const LoginPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email: formData.email, password: formData.password, role });
      navigate(role === 'user' ? '/user/dashboard' : '/delivery-partner/dashboard');
    } catch (error) {
      setError(error.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRoleSwitch = (newRole) => {
    navigate(`/login?role=${newRole}`, { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        py: 8,
      }}
    >
      <Container component="main" maxWidth="md">
        <Fade in={true} timeout={800}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              minHeight: '80vh',
              boxShadow: 6,
              borderRadius: 4,
              overflow: 'hidden',
              background: theme.palette.background.paper,
            }}
          >
            {/* Left Side - Illustration */}
            <Box
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)',
                color: 'white',
                p: isMobile ? 4 : 8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Box sx={{ maxWidth: '400px', width: '100%' }}>
                <LockIcon sx={{ fontSize: 60, mb: 3, opacity: 0.9 }} />
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                  Welcome Back!
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
                  {role === 'user' 
                    ? 'Sign in to access your food surplus requests and help reduce food waste.'
                    : 'Access the delivery dashboard to manage your food rescue deliveries.'}
                </Typography>
                
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant={role === 'user' ? 'contained' : 'outlined'}
                    onClick={() => handleRoleSwitch('user')}
                    startIcon={<PersonIcon />}
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      color: role === 'user' ? 'white' : 'inherit',
                      bgcolor: role === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    I'm a Food Recipient
                  </Button>
                  
                  <Button
                    variant={role === 'delivery' ? 'contained' : 'outlined'}
                    onClick={() => handleRoleSwitch('delivery')}
                    startIcon={<DeliveryIcon />}
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      color: role === 'delivery' ? 'white' : 'inherit',
                      bgcolor: role === 'delivery' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    I'm a Delivery Partner
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Right Side - Login Form */}
            <Box
              sx={{
                flex: 1,
                p: isMobile ? 4 : 8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ maxWidth: '400px', width: '100%', mx: 'auto' }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                  {role === 'user' ? 'User Login' : 'Delivery Partner Login'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Sign in to continue to {role === 'user' ? 'your account' : 'the delivery dashboard'}
                </Typography>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      alignItems: 'center',
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: '1px',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                            size="large"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Link 
                      href="/forgot-password" 
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!formData.email || !formData.password || isLoading}
                    sx={{
                      mt: 2,
                      mb: 3,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 14px 0 rgba(63, 81, 181, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 20px 0 rgba(63, 81, 181, 0.4)',
                      },
                    }}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account?
                    </Typography>
                  </Divider>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(`/signup?role=${role}`)}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: 'text.primary',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    Create an account
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginPage;
