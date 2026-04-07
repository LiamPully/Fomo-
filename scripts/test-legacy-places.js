/**
 * Test Location Search with LEGACY Google Places API
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

console.log('\n🔍 Testing LEGACY Google Places API...\n');

// Test 1: Autocomplete
async function testAutocomplete() {
  console.log('Test 1: Autocomplete (searching "Cape Town")');

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        'Cape Town'
      )}&components=country:za&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log(`✅ Success! Found ${data.predictions.length} predictions`);

      if (data.predictions.length > 0) {
        console.log('\nTop 3 results:');
        data.predictions.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.description}`);
          console.log(`     Place ID: ${p.place_id}`);
        });
        return data.predictions[0].place_id;
      }
    } else {
      console.error('❌ Failed:', data.status);
      console.log('Error message:', data.error_message || 'No details');
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
    console.log('\n⚠️ Skipping place details test');
    return;
  }

  console.log(`\nTest 2: Place Details (ID: ${placeId.substring(0, 20)}...)`);

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ Success!');
      console.log('  Name:', data.result.name);
      console.log('  Address:', data.result.formatted_address);
      console.log('  Location:', `${data.result.geometry.location.lat}, ${data.result.geometry.location.lng}`);
    } else {
      console.error('❌ Failed:', data.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 3: Address Search
async function testAddressSearch() {
  console.log('\nTest 3: Address Search ("V&A Waterfront")');

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        'V&A Waterfront'
      )}&components=country:za&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log(`✅ Success! Found ${data.predictions.length} predictions`);
      if (data.predictions.length > 0) {
        console.log('First result:', data.predictions[0].description);
      }
    } else {
      console.error('❌ Failed:', data.status);
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
