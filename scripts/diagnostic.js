/**
 * API Diagnostic - Run from command line
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY;

console.log('\n🔧 RUNNING FULL API DIAGNOSTIC\n');
console.log('='.repeat(60));

if (!API_KEY) {
  console.error('❌ API Key not found in .env file');
  process.exit(1);
}

console.log('API Key:', API_KEY.substring(0, 15) + '...');
console.log('');

// Test 1: Basic internet
console.log('Test 1: Checking internet connection...');
try {
  const response = await fetch('https://httpbin.org/get', { timeout: 5000 });
  if (response.ok) {
    console.log('✅ Internet connection OK\n');
  }
} catch (e) {
  console.log('❌ No internet connection:', e.message);
  console.log('Check your internet and try again.\n');
  process.exit(1);
}

// Test 2: Places API (server-side - no CORS issues from Node)
console.log('Test 2: Testing Places API from server...');
try {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      'Cape Town'
    )}&components=country:za&key=${API_KEY}`,
    { timeout: 10000 }
  );

  const text = await response.text();

  if (!text) {
    console.log('❌ Empty response from Google\n');
  } else {
    const data = JSON.parse(text);
    console.log('Response Status:', data.status);

    if (data.error_message) {
      console.log('Error Message:', data.error_message);
    }

    if (data.status === 'OK') {
      console.log(`✅ Places API works! Found ${data.predictions.length} results`);
      console.log('\nSample results:');
      data.predictions.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.description}`);
      });
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ REQUEST_DENIED');
      console.log('');
      console.log('Your API key is being rejected. This means either:');
      console.log('  1. The API key is invalid');
      console.log('  2. Places API is NOT enabled (most likely)');
      console.log('  3. The key has IP/referrer restrictions blocking it');
      console.log('');
      console.log('FIX: Go to https://console.cloud.google.com/apis/library');
      console.log('      Search "Places API" and click ENABLE');
      console.log('      Search "Geocoding API" and click ENABLE');
      console.log('      Wait 2 minutes and try again');
    } else if (data.status === 'INVALID_REQUEST') {
      console.log('❌ INVALID_REQUEST - missing parameters');
    } else {
      console.log('⚠️ Unexpected status:', data.status);
    }
  }
} catch (err) {
  console.log('❌ Error:', err.message);
}

console.log('');
console.log('='.repeat(60));

// Test 3: Check what error we get
console.log('\nTest 3: Detailed error check...');
try {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Johannesburg&components=country:za&key=${API_KEY}`
  );
  const data = await response.json();

  console.log('Full response:');
  console.log(JSON.stringify(data, null, 2));
} catch (err) {
  console.log('Fetch error:', err.message);
}

console.log('\n✅ Diagnostic complete!\n');
