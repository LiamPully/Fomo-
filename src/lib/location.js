// Location services for Fomo Markets
// Uses Google Places API (Legacy) + Browser Geolocation + Fallbacks

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// South African Provinces and Major Cities
const SA_LOCATIONS = {
  // PROVINCES
  'western cape': { lat: -33.9249, lng: 18.4241 },
  'gauteng': { lat: -26.2041, lng: 28.0473 },
  'kwazulu-natal': { lat: -29.8587, lng: 31.0218 },
  'kzn': { lat: -29.8587, lng: 31.0218 },
  'eastern cape': { lat: -33.9608, lng: 25.6022 },
  'free state': { lat: -29.0852, lng: 26.1596 },
  'limpopo': { lat: -23.9045, lng: 29.4688 },
  'mpumalanga': { lat: -25.4753, lng: 30.9694 },
  'northern cape': { lat: -28.7286, lng: 24.7287 },
  'north west': { lat: -25.6674, lng: 27.2421 },
  'northwest': { lat: -25.6674, lng: 27.2421 },

  // MAJOR CITIES
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'durban': { lat: -29.8587, lng: 31.0218 },
  'pretoria': { lat: -25.7479, lng: 28.2293 },
  'port elizabeth': { lat: -33.9608, lng: 25.6022 },
  'gqeberha': { lat: -33.9608, lng: 25.6022 },
  'bloemfontein': { lat: -29.0852, lng: 26.1596 },
  'nelspruit': { lat: -25.4753, lng: 30.9694 },
  'mbombela': { lat: -25.4753, lng: 30.9694 },
  'kimberley': { lat: -28.7384, lng: 24.7536 },
  'polokwane': { lat: -23.9045, lng: 29.4688 },
  'rustenburg': { lat: -25.6674, lng: 27.2421 },
  'east london': { lat: -33.0292, lng: 27.8546 },
  'pietermaritzburg': { lat: -29.6000, lng: 30.3794 },
  'benoni': { lat: -26.1881, lng: 28.3200 },
  'vereeniging': { lat: -26.6731, lng: 27.9312 },
  'boksburg': { lat: -26.2708, lng: 28.2405 },
  'welkom': { lat: -27.9772, lng: 26.7341 },
  'newcastle': { lat: -27.7580, lng: 29.9428 },
  'richards bay': { lat: -28.7800, lng: 32.0400 },
  'vanderbijlpark': { lat: -26.7110, lng: 27.8378 },
  'witbank': { lat: -25.8723, lng: 29.2155 },
  'emalahleni': { lat: -25.8723, lng: 29.2155 },
  'secunda': { lat: -26.5167, lng: 29.2000 },

  // WESTERN CAPE AREAS
  'stellenbosch': { lat: -33.9346, lng: 18.8749 },
  'franschhoek': { lat: -33.9098, lng: 19.1151 },
  'paarl': { lat: -33.7242, lng: 18.9628 },
  'hermanus': { lat: -34.4187, lng: 19.2345 },
  'knysna': { lat: -34.0351, lng: 23.0465 },
  'plettenberg bay': { lat: -34.0523, lng: 23.3716 },
  'george': { lat: -33.9634, lng: 22.4616 },
  'mossel bay': { lat: -34.1833, lng: 22.1461 },
  'sedgefield': { lat: -34.0167, lng: 22.7333 },
  ' Wilderness': { lat: -33.9833, lng: 22.5833 },
  'oudtshoorn': { lat: -33.5833, lng: 22.2000 },
  'beaufort west': { lat: -32.3500, lng: 22.5833 },
  'worchester': { lat: -33.6500, lng: 19.4500 },
  'swellendam': { lat: -34.0167, lng: 20.4333 },
  'caledon': { lat: -34.2333, lng: 19.4333 },
  'grabouw': { lat: -34.1500, lng: 19.0167 },
  'elgin': { lat: -34.1500, lng: 19.0167 },
  'bredasdorp': { lat: -34.5333, lng: 20.0333 },
  'citrusdal': { lat: -32.5833, lng: 19.0167 },
  ' Clanwilliam': { lat: -32.1833, lng: 18.8833 },

  // CAPE TOWN SUBURBS
  'woodstock': { lat: -33.9275, lng: 18.4570 },
  'observatory': { lat: -33.9379, lng: 18.4794 },
  'newlands': { lat: -33.9900, lng: 18.4300 },
  'claremont': { lat: -33.9808, lng: 18.4646 },
  'rondebosch': { lat: -33.9631, lng: 18.4762 },
  'sea point': { lat: -33.9187, lng: 18.3923 },
  'camps bay': { lat: -33.9500, lng: 18.3833 },
  'green point': { lat: -33.9000, lng: 18.4000 },
  'de waterkant': { lat: -33.9150, lng: 18.4120 },
  'gardens': { lat: -33.9500, lng: 18.4000 },
  'tamboerskloof': { lat: -33.9350, lng: 18.4050 },
  'oranjezicht': { lat: -33.9350, lng: 18.4100 },
  'hout bay': { lat: -34.0333, lng: 18.3500 },
  'constantia': { lat: -34.0167, lng: 18.4167 },
  'tokai': { lat: -34.0667, lng: 18.4333 },
  'muizenberg': { lat: -34.1167, lng: 18.4667 },
  'kalk bay': { lat: -34.1333, lng: 18.4500 },
  'simonstown': { lat: -34.1833, lng: 18.4333 },
  'fish hoek': { lat: -34.1333, lng: 18.4333 },
  'noordhoek': { lat: -34.1167, lng: 18.3667 },
  'kommetjie': { lat: -34.1333, lng: 18.3333 },
  'scarborough': { lat: -34.2000, lng: 18.3667 },
  'bloubergstrand': { lat: -33.7833, lng: 18.4833 },
  'table view': { lat: -33.7333, lng: 18.4833 },
  'milnerton': { lat: -33.8667, lng: 18.5000 },
  'pinelands': { lat: -33.9333, lng: 18.5000 },
  'goodwood': { lat: -33.9167, lng: 18.5500 },
  'parow': { lat: -33.9000, lng: 18.5833 },
  'bellville': { lat: -33.9000, lng: 18.6333 },
  'durbanville': { lat: -33.8333, lng: 18.6500 },
  'brackenfell': { lat: -33.8833, lng: 18.7000 },
  'kraaifontein': { lat: -33.8500, lng: 18.7167 },
  'kuils river': { lat: -33.9333, lng: 18.7167 },
  'eastridge': { lat: -34.0500, lng: 18.6000 },
  'mitchells plain': { lat: -34.0500, lng: 18.6000 },
  'athlone': { lat: -33.9500, lng: 18.5000 },
  'lansdowne': { lat: -33.9833, lng: 18.4833 },
  'kenilworth': { lat: -33.9833, lng: 18.4667 },
  'w Wynberg': { lat: -34.0000, lng: 18.4667 },
  'plumstead': { lat: -34.0333, lng: 18.4833 },
  'diep river': { lat: -34.0333, lng: 18.4667 },
  'retreat': { lat: -34.0500, lng: 18.4667 },
  'steenberg': { lat: -34.0667, lng: 18.4833 },

  // GAUTENG AREAS
  'soweto': { lat: -26.2678, lng: 27.8586 },
  'sandton': { lat: -26.1075, lng: 28.0567 },
  'rosebank': { lat: -26.1461, lng: 28.0379 },
  'braamfontein': { lat: -26.1941, lng: 28.0302 },
  'maboneng': { lat: -26.2041, lng: 28.0600 },
  'greenside': { lat: -26.1520, lng: 28.0180 },
  'parkhurst': { lat: -26.1400, lng: 28.0200 },
  'parktown': { lat: -26.1833, lng: 28.0333 },
  'melville': { lat: -26.1833, lng: 28.0167 },
  'fourways': { lat: -26.0200, lng: 28.0100 },
  'randburg': { lat: -26.1000, lng: 28.0000 },
  'midrand': { lat: -25.9833, lng: 28.1333 },
  'centurion': { lat: -25.8500, lng: 28.1333 },
  'hatfield': { lat: -25.7500, lng: 28.2333 },
  'menlyn': { lat: -25.7833, lng: 28.2833 },
  'lynnwood': { lat: -25.7667, lng: 28.3000 },
  'arcadia': { lat: -25.7450, lng: 28.2100 },
  'silverton': { lat: -25.7400, lng: 28.2800 },
  'monument park': { lat: -25.8000, lng: 28.2200 },
  'kyalami': { lat: -26.0000, lng: 28.0700 },
  'lanseria': { lat: -25.9400, lng: 27.9200 },
  'roodepoort': { lat: -26.1600, lng: 27.8600 },
  'krugersdorp': { lat: -26.1000, lng: 27.7700 },
  'mogale city': { lat: -26.1000, lng: 27.7700 },
  'germiston': { lat: -26.2333, lng: 28.1667 },
  'kempton park': { lat: -26.1000, lng: 28.2333 },
  'temba': { lat: -25.5833, lng: 28.2500 },
  'hammanskraal': { lat: -25.4000, lng: 28.2833 },
  'mamelodi': { lat: -25.7167, lng: 28.2833 },
  'soshanguve': { lat: -25.5333, lng: 28.1167 },
  'tembisa': { lat: -26.0000, lng: 28.2333 },
  'alexandra': { lat: -26.1000, lng: 28.1000 },
  'edenvale': { lat: -26.1333, lng: 28.1500 },
  'bedfordview': { lat: -26.1833, lng: 28.1500 },

  // KZN AREAS
  'umhlanga': { lat: -29.7167, lng: 31.0667 },
  'ballito': { lat: -29.5333, lng: 31.2167 },
  'berea': { lat: -29.8500, lng: 31.0167 },
  'morningside': { lat: -29.8167, lng: 31.0167 },
  'umhlanga rocks': { lat: -29.7333, lng: 31.0833 },
  'la lucia': { lat: -29.7667, lng: 31.0667 },
  'mount edgecombe': { lat: -29.7833, lng: 31.0333 },
  'phoenix': { lat: -29.7167, lng: 31.0000 },
  'verulam': { lat: -29.6667, lng: 31.0500 },
  'tongaat': { lat: -29.5667, lng: 31.1333 },
  'kwamashu': { lat: -29.7333, lng: 30.9833 },
  'inanda': { lat: -29.6833, lng: 30.9333 },
  'pinetown': { lat: -29.8167, lng: 30.8500 },
  'hillcrest': { lat: -29.7833, lng: 30.7667 },
  'kloof': { lat: -29.7833, lng: 30.8333 },
  'westville': { lat: -29.8333, lng: 30.9333 },
  'queensburgh': { lat: -29.8667, lng: 30.9000 },
  'amanzimtoti': { lat: -30.0500, lng: 30.8833 },
  'isipingo': { lat: -29.9833, lng: 30.9500 },
  'umkomaas': { lat: -30.2000, lng: 30.8000 },
  'scottburgh': { lat: -30.2833, lng: 30.7500 },
  'port shepstone': { lat: -30.7333, lng: 30.4500 },
  'margate': { lat: -30.8500, lng: 30.3667 },
  'kokstad': { lat: -30.5500, lng: 29.4167 },
  'ladysmith': { lat: -28.5500, lng: 29.7833 },
  'newcastle': { lat: -27.7500, lng: 29.9333 },
  'estcourt': { lat: -29.0000, lng: 29.8667 },
  'howick': { lat: -29.4833, lng: 30.2167 },
};

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

// Search places using Google Places API (via proxy) with local fallback
export const searchPlaces = async (query) => {
  const normalizedQuery = query.toLowerCase().trim();

  // Smart local matching - check for partial matches, word starts, etc.
  const localSuggestions = Object.entries(SA_LOCATIONS)
    .filter(([name]) => {
      const normalizedName = name.toLowerCase();
      // Direct inclusion match
      if (normalizedName.includes(normalizedQuery)) return true;
      // Query is contained in name
      if (normalizedQuery.includes(normalizedName)) return true;
      // Word boundary matching (e.g., "western" matches "western cape")
      const words = normalizedName.split(/[\s-]+/);
      return words.some(word => word.startsWith(normalizedQuery));
    })
    .map(([name, coords]) => ({
      description: name.charAt(0).toUpperCase() + name.slice(1),
      place_id: `local_${name.replace(/\s+/g, '_')}`,
      isFallback: true,
      coords
    }))
    .slice(0, 8); // Return up to 8 local suggestions

  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY.includes('your_')) {
    // No API key - return local suggestions only
    return { predictions: localSuggestions.slice(0, 5), error: null };
  }

  try {
    // Use proxy to avoid CORS - works in both dev and production
    const response = await fetch(
      `/api/places/autocomplete/json?input=${encodeURIComponent(
        query
      )}&components=country:za&key=${GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      // API unavailable - return local suggestions
      return { predictions: localSuggestions.slice(0, 5), error: null };
    }

    const data = await response.json();

    if (data.status === 'OK') {
      // Merge API results with local suggestions, prioritizing API results
      const apiPredictions = data.predictions.map(p => ({ ...p, isFallback: false }));
      // Combine but remove duplicates (based on description)
      const combined = [...apiPredictions];
      localSuggestions.forEach(local => {
        if (!combined.some(p => p.description.toLowerCase() === local.description.toLowerCase())) {
          combined.push(local);
        }
      });
      return { predictions: combined.slice(0, 5), error: null };
    } else if (data.status === 'ZERO_RESULTS') {
      // No API results but we have local suggestions
      return { predictions: localSuggestions.slice(0, 5), error: null };
    } else {
      console.error('Places API error:', data.status);
      // Return local suggestions on API error
      return { predictions: localSuggestions.slice(0, 5), error: null };
    }
  } catch (error) {
    console.error('Error fetching places:', error);
    // Network error - return local suggestions
    return { predictions: localSuggestions.slice(0, 5), error: null };
  }
};

// Get place details (including coordinates) via proxy
export const getPlaceDetails = async (placeId) => {
  if (!GOOGLE_PLACES_API_KEY) {
    return { details: null, error: 'API key not configured' };
  }

  try {
    const response = await fetch(
      `/api/places/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`
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

// Get coordinates from local SA locations database
const getLocalLocation = (address) => {
  const normalized = address.toLowerCase().trim();
  // Direct match
  if (SA_LOCATIONS[normalized]) {
    return SA_LOCATIONS[normalized];
  }
  // Try to find a match within the address string
  for (const [name, coords] of Object.entries(SA_LOCATIONS)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return coords;
    }
  }
  return null;
};

// Geocode address to coordinates via proxy with fallback
export const geocodeAddress = async (address, timeoutMs = 8000) => {
  // Try local fallback first
  const localCoords = getLocalLocation(address);
  if (localCoords) {
    // Still try API in background, but return local result immediately
    return {
      location: localCoords,
      formattedAddress: address,
      error: null,
      source: 'local'
    };
  }

  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY.includes('your_')) {
    return { location: null, error: 'Location search unavailable. Try major cities like Cape Town, Johannesburg, or Durban.' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `/api/geocode/json?address=${encodeURIComponent(
        address
      )}&components=country:ZA&key=${GOOGLE_PLACES_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // API unavailable, check local fallback one more time with partial match
      const partialMatch = getLocalLocation(address.split(',')[0]);
      if (partialMatch) {
        return {
          location: partialMatch,
          formattedAddress: address,
          error: null,
          source: 'local'
        };
      }
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
      // Try fallback for any other error
      const partialMatch = getLocalLocation(address.split(',')[0]);
      if (partialMatch) {
        return {
          location: partialMatch,
          formattedAddress: address,
          error: null,
          source: 'local'
        };
      }
      return { location: null, error: `Geocoding error: ${data.status}` };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      // Timeout - use fallback
      const partialMatch = getLocalLocation(address.split(',')[0]);
      if (partialMatch) {
        return {
          location: partialMatch,
          formattedAddress: address,
          error: null,
          source: 'local'
        };
      }
      return { location: null, error: 'Request timed out. Try a major city like "Cape Town" or "Johannesburg".' };
    }
    // Network error - use fallback
    const partialMatch = getLocalLocation(address.split(',')[0]);
    if (partialMatch) {
      return {
        location: partialMatch,
        formattedAddress: address,
        error: null,
        source: 'local'
      };
    }
    return { location: null, error: 'Network error. Try a major city like "Cape Town" or "Johannesburg".' };
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
