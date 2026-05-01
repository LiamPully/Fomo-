import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentPosition,
  calculateDistance,
  formatDistance,
  sortEventsByDistance,
  filterEventsByRadius,
  geocodeAddress,
  searchPlaces
} from '../lib/location';

const LOCATION_STORAGE_KEY = 'fomoza_user_location';

const loadStoredLocation = () => {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocationToStorage = (loc) => {
  try {
    if (loc) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to persist location:', e);
  }
};

export const useLocation = () => {
  const [location, setLocation] = useState(() => loadStoredLocation());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'

  // Check permission status on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state);
          result.onchange = () => setPermissionStatus(result.state);
        })
        .catch(() => {
          // Some browsers don't support querying geolocation permission
        });
    }
  }, []);

  // Request user location
  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition();
      setLocation(position);
      saveLocationToStorage(position);
      setPermissionStatus('granted');
      return position;
    } catch (err) {
      setError(err.message);
      setPermissionStatus('denied');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set location manually (e.g., from search)
  const setManualLocation = useCallback((lat, lng, name) => {
    const loc = { lat, lng, name };
    setLocation(loc);
    saveLocationToStorage(loc);
    setError(null);
    setPermissionStatus('granted');
  }, []);

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    saveLocationToStorage(null);
    setError(null);
  }, []);

  // Calculate distance to a point
  const getDistance = useCallback(
    (lat, lng) => {
      if (!location) return null;
      return calculateDistance(location.lat, location.lng, lat, lng);
    },
    [location]
  );

  // Format distance to a point
  const getFormattedDistance = useCallback(
    (lat, lng) => {
      const distance = getDistance(lat, lng);
      return distance ? formatDistance(distance) : null;
    },
    [getDistance]
  );

  // Sort events by distance
  const sortByDistance = useCallback(
    (events) => {
      if (!location) return events;
      return sortEventsByDistance(events, location.lat, location.lng);
    },
    [location]
  );

  // Filter events by radius
  const filterByRadius = useCallback(
    (events, radiusKm) => {
      if (!location) return events;
      return filterEventsByRadius(events, location.lat, location.lng, radiusKm);
    },
    [location]
  );

  return {
    location,
    error,
    loading,
    permissionStatus,
    requestLocation,
    setManualLocation,
    clearLocation,
    getDistance,
    getFormattedDistance,
    sortByDistance,
    filterByRadius,
    hasLocation: !!location
  };
};

// Hook for location search (Google Places)
export const useLocationSearch = (setManualLocation) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 3) {
      setPredictions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // Try to use Google Places API first
        const result = await searchPlaces(query);

        if (result.predictions && result.predictions.length > 0) {
          setPredictions(result.predictions);
        } else {
          // Fallback: provide common SA locations based on query
          const fallbackPredictions = getFallbackPredictions(query);
          setPredictions(fallbackPredictions);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        // Fallback on error
        setPredictions(getFallbackPredictions(query));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Fallback predictions for common South African locations
  // These use fake place_ids and MUST be geocoded by description, not place_id
  const getFallbackPredictions = (searchQuery) => {
    const saLocations = [
      { place_id: 'fallback_ec', description: 'Eastern Cape, South Africa', isFallback: true },
      { place_id: 'fallback_wc', description: 'Western Cape, South Africa', isFallback: true },
      { place_id: 'fallback_nc', description: 'Northern Cape, South Africa', isFallback: true },
      { place_id: 'fallback_kzn', description: 'KwaZulu-Natal, South Africa', isFallback: true },
      { place_id: 'fallback_gp', description: 'Gauteng, South Africa', isFallback: true },
      { place_id: 'fallback_mp', description: 'Mpumalanga, South Africa', isFallback: true },
      { place_id: 'fallback_lp', description: 'Limpopo, South Africa', isFallback: true },
      { place_id: 'fallback_nw', description: 'North West, South Africa', isFallback: true },
      { place_id: 'fallback_fs', description: 'Free State, South Africa', isFallback: true },
      { place_id: 'fallback_ct', description: 'Cape Town, Western Cape, South Africa', isFallback: true },
      { place_id: 'fallback_jhb', description: 'Johannesburg, Gauteng, South Africa', isFallback: true },
      { place_id: 'fallback_dbn', description: 'Durban, KwaZulu-Natal, South Africa', isFallback: true },
      { place_id: 'fallback_pta', description: 'Pretoria, Gauteng, South Africa', isFallback: true },
      { place_id: 'fallback_pe', description: 'Port Elizabeth, Eastern Cape, South Africa', isFallback: true },
      { place_id: 'fallback_bloem', description: 'Bloemfontein, Free State, South Africa', isFallback: true }
    ];

    const lowerQuery = searchQuery.toLowerCase();
    return saLocations.filter(loc =>
      loc.description.toLowerCase().includes(lowerQuery)
    );
  };

  const selectPrediction = useCallback(async (prediction) => {
    setQuery(prediction.description);
    setPredictions([]);

    // Always geocode by description - works for both Google predictions and fallbacks
    // Fallback predictions have fake place_ids that can't be used with Places API
    if (setManualLocation) {
      try {
        console.log('[useLocationSearch] Geocoding:', prediction.description);
        const result = await geocodeAddress(prediction.description);
        if (result.location) {
          console.log('[useLocationSearch] Geocoded successfully:', result.location);
          setManualLocation(
            result.location.lat,
            result.location.lng,
            prediction.description
          );
        } else {
          console.error('[useLocationSearch] Geocoding failed:', result.error);
        }
      } catch (err) {
        console.error('[useLocationSearch] Failed to geocode selected location:', err);
      }
    }

    return prediction;
  }, [setManualLocation]);

  return {
    query,
    setQuery,
    predictions,
    loading,
    error,
    selectPrediction
  };
};

// Hook for location search with external query control (prevents re-render on every keystroke)
export const useLocationSearchWithQuery = (externalQuery) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search when externalQuery changes (already debounced by caller)
  useEffect(() => {
    if (!externalQuery || externalQuery.length < 3) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchPlaces(externalQuery)
      .then((result) => {
        if (result.predictions && result.predictions.length > 0) {
          setPredictions(result.predictions);
        } else {
          // Fallback predictions
          setPredictions(getFallbackPredictions(externalQuery));
        }
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setPredictions(getFallbackPredictions(externalQuery));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [externalQuery]);

  // Fallback predictions for common South African locations
  const getFallbackPredictions = (searchQuery) => {
    const saLocations = [
      { place_id: 'fallback_ec', description: 'Eastern Cape, South Africa', isFallback: true },
      { place_id: 'fallback_wc', description: 'Western Cape, South Africa', isFallback: true },
      { place_id: 'fallback_nc', description: 'Northern Cape, South Africa', isFallback: true },
      { place_id: 'fallback_kzn', description: 'KwaZulu-Natal, South Africa', isFallback: true },
      { place_id: 'fallback_gp', description: 'Gauteng, South Africa', isFallback: true },
      { place_id: 'fallback_mp', description: 'Mpumalanga, South Africa', isFallback: true },
      { place_id: 'fallback_lp', description: 'Limpopo, South Africa', isFallback: true },
      { place_id: 'fallback_nw', description: 'North West, South Africa', isFallback: true },
      { place_id: 'fallback_fs', description: 'Free State, South Africa', isFallback: true },
      { place_id: 'fallback_ct', description: 'Cape Town, Western Cape, South Africa', isFallback: true },
      { place_id: 'fallback_jhb', description: 'Johannesburg, Gauteng, South Africa', isFallback: true },
      { place_id: 'fallback_dbn', description: 'Durban, KwaZulu-Natal, South Africa', isFallback: true },
      { place_id: 'fallback_pta', description: 'Pretoria, Gauteng, South Africa', isFallback: true },
      { place_id: 'fallback_pe', description: 'Port Elizabeth, Eastern Cape, South Africa', isFallback: true },
      { place_id: 'fallback_bloem', description: 'Bloemfontein, Free State, South Africa', isFallback: true }
    ];

    const lowerQuery = searchQuery.toLowerCase();
    return saLocations.filter(loc =>
      loc.description.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    predictions,
    loading,
    error
  };
};
