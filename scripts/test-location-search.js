/**
 * Test Location Search with NEW Google Places API
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const GOOGLE_PLACES_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  console.error('❌ VITE_GOOGLE_PLACES_API_KEY not found in .env');
  process.exit(1);
}

console.log('\n🔍 Testing NEW Google Places API...\n');
console.log('API Key:', GOOGLE_PLACES_API_KEY.substring(0, 10) + '...\n');

// Test 1: Autocomplete
async function testAutocomplete() {
  console.log('Test 1: Autocomplete (searching "Cape Town")');

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocompleteText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        },
        body: JSON.stringify({
          input: 'Cape Town',
          locationBias: {
            rectangle: {
              low: { latitude: -35.0, longitude: 16.0 },
              high: { latitude: -22.0, longitude: 33.0 }
            }
          },
          includedRegionCodes: ['za']
        })
      }
    );

    const text = await response.text();
    console.log('  Response status:', response.status);
    console.log('  Response text:', text.substring(0, 500));

    if (!text) {
      console.error('  ❌ Empty response');
      return null;
    }

    const data = JSON.parse(text);

    if (response.ok) {
      const suggestions = data.suggestions || [];
      console.log(`✅ Success! Found ${suggestions.length} suggestions`);

      if (suggestions.length > 0) {
        console.log('\nTop 3 results:');
        suggestions.slice(0, 3).forEach((s, i) => {
          const prediction = s.placePrediction;
          console.log(`  ${i + 1}. ${prediction?.text?.text || 'N/A'}`);
          console.log(`     Place ID: ${prediction?.placeId || 'N/A'}`);
        });

        // Return first place ID for next test
        return suggestions[0]?.placePrediction?.placeId;
      }
    } else {
      console.error('❌ Failed:', data.error?.message || response.statusText);
      console.log('Full error:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Test 2: Place Details
async function testPlaceDetails(placeId) {
  if (!placeId) {
    console.log('\n⚠️ Skipping place details test (no place ID)');
    return;
  }

  console.log(`\nTest 2: Place Details (ID: ${placeId})`);

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        }
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('  Name:', data.displayName?.text || 'N/A');
      console.log('  Address:', data.formattedAddress || 'N/A');
      console.log('  Location:', data.location ?
        `${data.location.latitude}, ${data.location.longitude}` : 'N/A');
    } else {
      console.error('❌ Failed:', data.error?.message || response.statusText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 3: Search for a specific address
async function testAddressSearch() {
  console.log('\nTest 3: Address Search ("V&A Waterfront")');

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocompleteText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        },
        body: JSON.stringify({
          input: 'V&A Waterfront',
          includedRegionCodes: ['za']
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      const suggestions = data.suggestions || [];
      console.log(`✅ Success! Found ${suggestions.length} suggestions`);

      if (suggestions.length > 0) {
        console.log('First result:', suggestions[0]?.placePrediction?.text?.text);
      }
    } else {
      console.error('❌ Failed:', data.error?.message || response.statusText);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
async function runTests() {
  const placeId = await testAutocomplete();
  await testPlaceDetails(placeId);
  await testAddressSearch();

  console.log('\n✨ Tests complete!\n');
}

runTests();
