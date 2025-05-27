# Location-Aware Form Components

This directory contains form components that automatically detect and manage user location for the Surplus Plus application.

## Components

### LocationAwareForm

A form component that automatically detects the user's location and allows them to select a location on a map.

#### Props

- `type` (String, optional): Type of form - 'donor' or 'receiver'. Defaults to 'donor'.
- `onSubmit` (Function): Callback function that receives form data when submitted.
- `initialValues` (Object, optional): Initial form values. Can include:
  - name (String)
  - contact (String)
  - address (String)
  - notes (String)
  - location (Object with lat and lng properties)

#### Usage

```jsx
import LocationAwareForm from './LocationAwareForm';

function DonationPage() {
  const handleSubmit = async (formData) => {
    // formData includes:
    // - name: string
    // - contact: string
    // - address: string (formatted address)
    // - notes: string
    // - location: { lat: number, lng: number }
    console.log('Form submitted:', formData);
    
    // TODO: Send data to your backend
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      // Handle response
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <h1>Donate Food</h1>
      <LocationAwareForm 
        type="donor" 
        onSubmit={handleSubmit} 
        initialValues={{
          name: 'John Doe',
          // other initial values
        }}
      />
    </div>
  );
}
```

## Features

- **Automatic Location Detection**: Automatically detects the user's current location when the component mounts.
- **Interactive Map**: Displays an interactive map where users can click to select or change their location.
- **Reverse Geocoding**: Converts latitude/longitude to a human-readable address.
- **Responsive Design**: Works on both desktop and mobile devices.
- **Error Handling**: Handles cases where geolocation is not available or permission is denied.

## Dependencies

- @react-google-maps/api: For Google Maps integration
- @mui/material: For UI components
- react: ^17.0.0

## Environment Variables

Make sure to set up the following environment variable in your `.env` file:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Error Handling

The component handles the following error cases:
- Geolocation not supported by the browser
- User denies location permission
- Geocoding service errors
- Network errors

## Styling

The component uses Material-UI's styling system. You can override styles using the `sx` prop or by using the `theme` provider.
