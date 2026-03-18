# Google Places API Setup Guide

## What You Get

- **Location Search**: Users can search for cities/suburbs
- **Geocoding**: Convert addresses to coordinates
- **Distance Calculation**: Show events sorted by distance
- **"Near Me" Feature**: Use browser GPS to find nearby events

## Step 1: Create Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click "Select a project" → "New Project"
4. Name it: `fomo-markets`
5. Click "Create"

## Step 2: Enable Places API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Places API"
3. Click on "Places API" (New)
4. Click **Enable**

Also enable these APIs:
- **Geocoding API** (for address to coordinates)
- **Maps JavaScript API** (if you want a map view later)

## Step 3: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the key (starts with `AIza...`)

## Step 4: Restrict API Key (Security)

**Important**: Restrict your key to prevent abuse

1. In Credentials, click on your API key
2. Under **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add these:
     ```
     http://localhost:3000/*
     https://your-production-domain.com/*
     ```
3. Under **API restrictions**:
   - Select "Restrict key"
   - Check: Places API, Geocoding API
4. Click **Save**

## Step 5: Add to Environment Variables

1. Open your `.env` file
2. Add your API key:
   ```env
   VITE_GOOGLE_PLACES_API_KEY=AIzaYourActualKeyHere
   ```
3. Restart your dev server: `npm run dev`

## Free Tier Limits

Google Places API gives you **$200 free credit per month**, which equals:

- **Places Autocomplete**: ~5,000 requests/day
- **Geocoding**: ~40,000 requests/day

**For a new app, this is more than enough!**

## Testing

After setup, test these features:

1. **Location Search**: Type "Cape Town" in the search box
2. **"Use My Location"**: Click the button (allow browser permission)
3. **Distance Sorting**: Events should sort by nearest

## Troubleshooting

### "API key not valid" error
- Check the key is copied correctly
- Ensure Places API is enabled
- Wait 5 minutes after enabling (propagation delay)

### "This API project is not authorized"
- Check API restrictions in Credentials
- Make sure Places API is checked

### CORS errors
- Add your domain to HTTP referrers
- Include `http://localhost:3000/*` for development

### "Over quota" errors
- Check usage in Google Cloud Console
- You may need to add billing (still free under $200)

## Cost Monitoring

To avoid surprises:

1. Go to **Billing** → **Budgets & alerts**
2. Create a budget of $10/month
3. Set alerts at 50%, 90%, 100%

You'll get emails if usage is high (unlikely for a new app).

## South Africa Specific Notes

- The API works great for SA cities/suburbs
- It recognizes local place names
- Supports all official languages
- Street addresses may be less accurate than cities

## Next Steps

After Places API is working:

1. Test location search in the app
2. Verify distance calculations
3. Add "Near Me" button functionality
4. Test on mobile devices

## Files Using Places API

- `src/lib/location.js` - Core location functions
- `src/hooks/useLocation.js` - React hooks
- `src/components/LocationSearch.jsx` - Search UI

## Questions?

- Google Places docs: https://developers.google.com/maps/documentation/places/web-service/overview
- Pricing: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
