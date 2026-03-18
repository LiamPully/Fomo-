// Location services for Fomo Markets
// Uses Google Places API + Browser Geolocation

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Get user's current position using browser GPS
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Format distance for display
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};

// Search places using Google Places API
// Supports addresses, streets, suburbs, cities, and provinces
export const searchPlaces = async (query) => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key not configured');
    return { predictions: [], error: 'API key not configured' };
  }

  try {
    // Using the Places Autocomplete API without type restriction
    // This allows: street addresses, suburbs, cities, provinces
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&components=country:za&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return { predictions: data.predictions, error: null };
    } else if (data.status === 'ZERO_RESULTS') {
      return { predictions: [], error: null };
    } else {
      console.error('Places API error:', data.status);
      return { predictions: [], error: data.status };
    }
  } catch (error) {
    console.error('Error fetching places:', error);
    return { predictions: [], error: error.message };
  }
};

// Get place details (including coordinates)
export const getPlaceDetails = async (placeId) => {
  if (!GOOGLE_PLACES_API_KEY) {
    return { details: null, error: 'API key not configured' };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return {
        details: {
          name: data.result.name,
          address: data.result.formatted_address,
          location: data.result.geometry.location
        },
        error: null
      };
    } else {
      return { details: null, error: data.status };
    }
  } catch (error) {
    return { details: null, error: error.message };
  }
};

// Geocode address to coordinates (fallback if Places API fails)
export const geocodeAddress = async (address, timeoutMs = 10000) => {
  if (!GOOGLE_PLACES_API_KEY) {
    return { location: null, error: 'API key not configured' };
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&components=country:ZA&key=${GOOGLE_PLACES_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { location: null, error: `HTTP error: ${response.status}` };
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return {
        location: data.results[0].geometry.location,
        formattedAddress: data.results[0].formatted_address,
        error: null
      };
    } else if (data.status === 'ZERO_RESULTS') {
      return { location: null, error: 'No results found for this address' };
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      return { location: null, error: 'API quota exceeded' };
    } else if (data.status === 'REQUEST_DENIED') {
      return { location: null, error: 'API request denied - check your API key' };
    } else {
      return { location: null, error: `Geocoding error: ${data.status}` };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { location: null, error: 'Request timed out - please try again' };
    }
    return { location: null, error: error.message };
  }
};

// Sort events by distance from user
export const sortEventsByDistance = (events, userLat, userLng) => {
  return events
    .map((event) => ({
      ...event,
      distance:
        event.latitude && event.longitude
          ? calculateDistance(userLat, userLng, event.latitude, event.longitude)
          : null
    }))
    .sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
};

// Filter events within radius and add distance property
export const filterEventsByRadius = (events, userLat, userLng, radiusKm) => {
  return events
    .map((event) => ({
      ...event,
      distance:
        event.latitude && event.longitude
          ? calculateDistance(userLat, userLng, event.latitude, event.longitude)
          : null
    }))
    .filter((event) => {
      if (event.distance === null) return false;
      return event.distance <= radiusKm;
    });
};
