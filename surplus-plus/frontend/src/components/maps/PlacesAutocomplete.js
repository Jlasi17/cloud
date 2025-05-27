import React, { useState, useRef, useEffect } from 'react';
import { TextField, Box, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { AUTOCOMPLETE_OPTIONS } from '../../config/config';

const PlacesAutocomplete = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter a location',
  label = 'Location',
  error,
  helperText,
  disabled = false,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const inputRef = useRef(null);

  // Initialize the Google Places Autocomplete service
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    }
    return () => {
      // Cleanup
      if (placesService.current) {
        placesService.current = null;
      }
    };
  }, []);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange?.(e);

    if (!value) {
      setPredictions([]);
      return;
    }

    // Get place predictions
    if (autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          ...AUTOCOMPLETE_OPTIONS,
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setIsOpen(true);
          } else {
            setPredictions([]);
          }
        }
      );
    }
  };

  const handleSelect = (placeId, description) => {
    if (!placesService.current) return;

    setInputValue(description);
    setPredictions([]);
    setIsOpen(false);

    // Get place details
    placesService.current.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address', 'address_components'],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          onSelect?.({
            placeId,
            description,
            location: place.geometry?.location
              ? {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                }
              : null,
            address: place.formatted_address || description,
            addressComponents: place.address_components,
          });
        }
      }
    );
  };

  const handleBlur = () => {
    // Use a small timeout to allow click events to fire before closing
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <Box position="relative" width="100%">
      <TextField
        inputRef={inputRef}
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue && setPredictions(predictions)}
        onBlur={handleBlur}
        placeholder={placeholder}
        fullWidth
        error={!!error}
        helperText={error || helperText}
        disabled={disabled}
        {...props}
      />
      {isOpen && predictions.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            width: '100%',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1300,
            mt: 0.5,
          }}
        >
          <List dense>
            {predictions.map((prediction) => (
              <ListItem
                button
                key={prediction.place_id}
                onClick={() => handleSelect(prediction.place_id, prediction.description)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={prediction.structured_formatting.main_text}
                  secondary={prediction.structured_formatting.secondary_text}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default PlacesAutocomplete;
