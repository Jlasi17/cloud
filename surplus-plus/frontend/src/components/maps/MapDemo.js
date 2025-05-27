import React, { useState, useCallback } from 'react';

import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  Tooltip, 
  IconButton, 
  ToggleButtonGroup, 
  ToggleButton,
  CircularProgress
} from '@mui/material';
// Import components directly to avoid circular dependencies
import Map from './Map';
import LocationPicker from './LocationPicker';
import PlacesAutocomplete from './PlacesAutocomplete';
import { 
  DirectionsCar as DirectionsCarIcon, 
  DirectionsWalk as DirectionsWalkIcon, 
  DirectionsBike as DirectionsBikeIcon, 
  DirectionsBus as DirectionsBusIcon, 
  SwapHoriz as SwapHorizIcon, 
  MyLocation as MyLocationIcon 
} from '@mui/icons-material';
import useGeocode from '../../hooks/useGeocode';
import useDirections from '../../hooks/useDirections';
import { TRAVEL_MODES, DEFAULT_MAP_CENTER } from '../../config/config';

const MapDemo = () => {
  // State for location selection
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [travelMode, setTravelMode] = useState(TRAVEL_MODES.DRIVING);
  const [showDirections, setShowDirections] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  
  // State for directions and distance info
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  
  // Initialize custom hooks
  const { reverseGeocode } = useGeocode();
  const { 
    calculateRoute, 
    directions, 
    isLoading: isDirectionsLoading, 
    error 
  } = useDirections();

  // Handle location selection from PlacesAutocomplete
  const handleOriginSelect = (place) => {
    if (place?.location) {
      setOrigin(place.location);
      updateMarkers(place.location, 'origin');
    }
  };

  const handleDestinationSelect = (place) => {
    if (place?.location) {
      setDestination(place.location);
      updateMarkers(place.location, 'destination');
    }
  };

  // Update markers on the map
  const updateMarkers = (location, type) => {
    setMarkers(prevMarkers => {
      // Remove existing marker of the same type
      const filteredMarkers = prevMarkers.filter(marker => marker.type !== type);
      
      // Add new marker
      return [
        ...filteredMarkers,
        {
          position: location,
          type,
          label: type === 'origin' ? 'A' : 'B',
          info: {
            title: type === 'origin' ? 'Origin' : 'Destination',
            description: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`
          }
        }
      ];
    });
  };

  // Get current location using browser's geolocation
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setOrigin(location);
          updateMarkers(location, 'origin');
          
          // Reverse geocode to get address
          reverseGeocode(location)
            .then(address => {
              console.log('Current location address:', address);
            })
            .catch(error => {
              console.error('Error reverse geocoding:', error);
            });
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Could not get your current location. Please make sure location services are enabled.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  // Swap origin and destination
  const swapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // Handle travel mode change
  const handleTravelModeChange = (event, newMode) => {
    if (newMode !== null) {
      setTravelMode(newMode);
    }
  };

  // Calculate route when both origin and destination are set
  const handleCalculateRoute = () => {
    if (origin && destination) {
      setShowDirections(true);
      calculateRoute(origin, destination, travelMode);
    } else {
      alert('Please set both origin and destination');
    }
  };

  // Handle map click
  const handleMapClick = (e) => {
    const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    
    if (!origin) {
      setOrigin(location);
      updateMarkers(location, 'origin');
    } else if (!destination) {
      setDestination(location);
      updateMarkers(location, 'destination');
    } else {
      // If both origin and destination are set, update the one that was set first
      setOrigin(destination);
      setDestination(location);
      updateMarkers(destination, 'origin');
      updateMarkers(location, 'destination');
    }
  };

  // Handle directions changed
  const handleDirectionsChanged = (result) => {
    console.log('Directions changed:', result);
    // You can access the route details here if needed
  };

  // Handle distance/duration update
  const handleDistanceDurationUpdate = ({ distance, duration }) => {
    setDistance(distance);
    setDuration(duration);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Google Maps Integration Demo
      </Typography>
      <Typography variant="body1" paragraph>
        This demo showcases the integration of various Google Maps APIs including Geocoding, Directions, Distance Matrix, and Places.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Controls */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Route Planner" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ mr: 1 }}>From:</Typography>
                  <Tooltip title="Use my current location">
                    <IconButton 
                      size="small" 
                      onClick={getCurrentLocation}
                      color={currentLocation ? 'primary' : 'default'}
                    >
                      <MyLocationIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <LocationPicker
                  onSelect={handleOriginSelect}
                  placeholder="Enter origin address"
                  value={origin?.address}
                  fullWidth
                  size="small"
                  margin="dense"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <IconButton 
                  size="small" 
                  onClick={swapLocations}
                  disabled={!origin || !destination}
                >
                  <SwapHorizIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>To:</Typography>
                <LocationPicker
                  onSelect={handleDestinationSelect}
                  placeholder="Enter destination address"
                  value={destination?.address}
                  fullWidth
                  size="small"
                  margin="dense"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Travel Mode:</Typography>
                <ToggleButtonGroup
                  value={travelMode}
                  exclusive
                  onChange={handleTravelModeChange}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value={TRAVEL_MODES.DRIVING} aria-label="Driving">
                    <Tooltip title="Driving">
                      <DirectionsCarIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value={TRAVEL_MODES.WALKING} aria-label="Walking">
                    <Tooltip title="Walking">
                      <DirectionsWalkIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value={TRAVEL_MODES.BICYCLING} aria-label="Bicycling">
                    <Tooltip title="Bicycling">
                      <DirectionsBikeIcon />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value={TRAVEL_MODES.TRANSIT} aria-label="Transit">
                    <Tooltip title="Transit">
                      <DirectionsBusIcon />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCalculateRoute}
                disabled={!origin || !destination || isDirectionsLoading}
                startIcon={isDirectionsLoading ? <CircularProgress size={20} /> : null}
              >
                {isDirectionsLoading ? 'Calculating...' : 'Get Directions'}
              </Button>
              
              {(distance || duration) && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Route Summary</Typography>
                  <Typography variant="body2">Distance: {distance}</Typography>
                  <Typography variant="body2">Duration: {duration}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader 
              title="Location Details" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" paragraph>
                Click on the map to set origin or destination. Use the search boxes to find locations by address.
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Origin:</Typography>
                {origin ? (
                  <Typography variant="body2">
                    {origin.address || `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}`}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">Not set</Typography>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Destination:</Typography>
                {destination ? (
                  <Typography variant="body2">
                    {destination.address || `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}`}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">Not set</Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="caption" color="textSecondary">
                Powered by Google Maps Platform
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right column - Map */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
            <Map
              center={origin || DEFAULT_MAP_CENTER}
              zoom={origin ? 14 : 12}
              markers={markers}
              onMapClick={handleMapClick}
              onMarkerClick={(marker, index) => console.log('Marker clicked:', marker, index)}
              selectedMarker={markers.length > 0 ? 0 : null}
              showDirections={showDirections}
              origin={origin}
              destination={destination}
              travelMode={travelMode}
              onDirectionsChanged={handleDirectionsChanged}
              onDistanceDurationUpdate={handleDistanceDurationUpdate}
              style={{ height: '100%' }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MapDemo;
