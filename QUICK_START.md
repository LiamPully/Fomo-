# Fomo Markets - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Google account (for Places API)

## Setup Steps

### 1. Install Dependencies
```bash
cd happenings
npm install
```

### 2. Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
# Supabase (from Week 1)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Places API (from Week 2)
VITE_GOOGLE_PLACES_API_KEY=AIzaYourKeyHere
```

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Feature Checklist

### Week 1: Supabase ✅
- [ ] Database schema created
- [ ] Sample events loaded
- [ ] API functions working
- [ ] Auth configured

### Week 2: Location ✅
- [ ] Google Places API key added
- [ ] Location search working
- [ ] "Use my location" button working
- [ ] Distance calculation working

### Week 3: Integration (Next)
- [ ] Connect React to Supabase
- [ ] Replace mock data
- [ ] Add event images
- [ ] Test CRUD operations

## Testing Location Features

1. **Open the app** at http://localhost:3000
2. **Click "Use my location"** - Allow browser permission
3. **Or type a location** - e.g., "Cape Town", "Johannesburg"
4. **Events should sort** by distance from your location

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### "Google Places API key not configured"
- Check your `.env` file has the key
- Restart the dev server after adding the key

### Location not working
- Make sure you're on HTTPS (or localhost)
- Check browser permissions for location
- Try a different browser

### Database connection errors
- Verify Supabase URL and key in `.env`
- Check Supabase project is running
- Ensure database schema was applied

## Project Structure

```
happenings/
├── src/
│   ├── api/
│   │   ├── events.js          # Event API functions
│   │   └── businesses.js      # Business API functions
│   ├── components/
│   │   └── LocationSearch.jsx # Location search UI
│   ├── hooks/
│   │   └── useLocation.js     # Location React hooks
│   ├── lib/
│   │   ├── supabase.js        # Supabase client
│   │   └── location.js        # Location utilities
│   ├── App.jsx                # Main app
│   └── main.jsx               # Entry point
├── supabase-schema.sql        # Database schema
├── supabase-seed.sql          # Sample data
├── .env.example               # Environment template
└── package.json
```

## Deployment

When ready to deploy:

1. **Build**: `npm run build`
2. **Test**: `npm run preview`
3. **Deploy**: Upload `dist/` folder to Vercel/Netlify

## Support

- Supabase docs: https://supabase.com/docs
- Google Places docs: https://developers.google.com/maps/documentation/places
- React docs: https://react.dev

## Next Steps

1. Complete Week 1 (Supabase setup)
2. Complete Week 2 (Google Places API)
3. Move to Week 3 (connect everything together)

Ready to continue with Week 3?
