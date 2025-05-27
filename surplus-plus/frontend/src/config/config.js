// Google Maps API Configuration
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Default map center (e.g., city center or default location)
export const DEFAULT_MAP_CENTER = {
  lat: 17.3850,  // Default to Hyderabad, India
  lng: 78.4867
};

// Default map zoom level
export const DEFAULT_ZOOM = 12;

// Map style configuration
export const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  }
];

// Travel modes for directions
export const TRAVEL_MODES = {
  DRIVING: 'DRIVING',
  WALKING: 'WALKING',
  BICYCLING: 'BICYCLING',
  TRANSIT: 'TRANSIT'
};

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: MAP_STYLES
};

// Places Autocomplete configuration
export const AUTOCOMPLETE_OPTIONS = {
  types: ['address'],
  componentRestrictions: { country: 'in' },
  fields: ['address_components', 'geometry', 'formatted_address']
};

// Default map container style
export const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};
