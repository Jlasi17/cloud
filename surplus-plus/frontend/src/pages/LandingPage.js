import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Avatar,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #3f51b5 0%, #283593 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 0%, transparent 20%)',
          zIndex: 1,
        },
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: isMobile ? 6 : 12,
          px: isMobile ? 2 : 4,
        }}
      >
        <Fade in={true} timeout={1000}>
          <Box
            sx={{
              maxWidth: 800,
              mx: 'auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                width: isMobile ? 100 : 140,
                height: isMobile ? 100 : 140,
                mb: 4,
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <RestaurantIcon 
                sx={{ 
                  fontSize: isMobile ? 50 : 70,
                  color: 'white'
                }} 
              />
            </Avatar>
            
            <Typography 
              variant={isMobile ? 'h3' : 'h2'} 
              component="h1" 
              sx={{
                fontWeight: 800,
                mb: 2,
                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
              }}
            >
              Fight Food Waste,              <Box component="span" sx={{ color: 'secondary.main' }}> Feed Communities</Box>
            </Typography>
            
            <Typography 
              variant={isMobile ? 'h6' : 'h5'} 
              component="h2" 
              sx={{
                fontWeight: 400,
                mb: 4,
                maxWidth: 700,
                opacity: 0.9,
                lineHeight: 1.5,
              }}
            >
              Join our mission to reduce food waste and ensure no one in our community goes hungry
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{
                mb: 6, 
                maxWidth: 600,
                opacity: 0.85,
                lineHeight: 1.7,
                fontSize: isMobile ? '1rem' : '1.1rem',
              }}
            >
              Connect with local businesses and individuals to rescue surplus food and distribute it to those who need it most.
              Together, we can make a difference—one meal at a time.
            </Typography>

            <Button
              variant="contained"
              color="secondary"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleGetStarted}
              sx={{
                px: 6,
                py: 1.8,
                borderRadius: 50,
                textTransform: 'none',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 600,
                boxShadow: '0 8px 25px -8px rgba(255, 152, 0, 0.5)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px -8px rgba(255, 152, 0, 0.7)',
                },
              }}
            >
              Get Started
            </Button>
            
            <Box 
              sx={{ 
                mt: 8,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 4,
                opacity: 0.8,
                '& > *': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                },
              }}
            >
              <Typography variant="body2">
                <span role="img" aria-label="plate">🍽️</span> Reduce Food Waste
              </Typography>
              <Typography variant="body2">
                <span role="img" aria-label="heart">❤️</span> Support Your Community
              </Typography>
              <Typography variant="body2">
                <span role="img" aria-label="globe">🌍</span> Help the Environment
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Container>
      
      <Box 
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.1), transparent)',
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default LandingPage;
