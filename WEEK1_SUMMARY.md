# Week 1 Complete: Supabase Setup

## What Was Done

### 1. Database Schema Created (`supabase-schema.sql`)

**Tables:**
- `categories` - Event categories (Market, Event, Fun, Other)
- `businesses` - Business accounts with subscription info
- `events` - Main events table with location, contact, timing

**Features:**
- UUID primary keys
- Foreign key relationships
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic updated_at timestamps
- View count tracking

### 2. API Layer Created

**`src/lib/supabase.js`**
- Supabase client configuration
- Helper functions for auth

**`src/api/events.js`**
- `fetchEvents()` - Get all events with filters
- `fetchEventById()` - Get single event
- `createEvent()` - Create new event
- `updateEvent()` - Update existing event
- `deleteEvent()` - Delete event
- `fetchBusinessEvents()` - Get events by business
- `searchEvents()` - Text search

**`src/api/businesses.js`**
- `getOrCreateBusiness()` - Get or create business profile
- `getBusiness()` - Get business by ID
- `updateBusiness()` - Update business info
- `incrementEventCount()` - Track event quota
- `canPublishEvent()` - Check subscription limits

### 3. Sample Data (`supabase-seed.sql`)

- 12 sample events (markets, festivals, etc.)
- 2 demo businesses (free and paid)
- Real South African locations

### 4. Configuration Files

**`.env.example`**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### 5. Documentation

- `SUPABASE_SETUP.md` - Step-by-step setup guide
- Updated `README.md` with Supabase info

## What You Need To Do

### Step 1: Create Supabase Account (5 mins)
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create new project named "fomo-markets"
4. Choose region: EU West (closest to SA)

### Step 2: Get API Keys (2 mins)
1. In Supabase dashboard, go to Settings → API
2. Copy "Project URL" and "anon public" key

### Step 3: Configure Environment (2 mins)
1. Copy `.env.example` to `.env`
2. Paste your Supabase URL and key

### Step 4: Run Database Schema (3 mins)
1. In Supabase, go to SQL Editor
2. Copy contents of `supabase-schema.sql`
3. Click Run

### Step 5: Add Sample Data (2 mins)
1. In SQL Editor, create new query
2. Copy contents of `supabase-seed.sql`
3. Click Run

### Step 6: Test (1 min)
1. Restart dev server: `npm run dev`
2. Open http://localhost:3000
3. Check browser console for errors

**Total setup time: ~15 minutes**

## Next: Week 2

After Supabase is working:
1. Connect React components to real API
2. Replace mock data with database calls
3. Add location services (Google Places API)
4. Implement distance calculation

## Files Created

```
happenings/
├── supabase-schema.sql      # Database tables & RLS
├── supabase-seed.sql        # Sample data
├── SUPABASE_SETUP.md        # Setup instructions
├── WEEK1_SUMMARY.md         # This file
├── .env.example             # Environment template
├── src/
│   ├── lib/
│   │   └── supabase.js      # Client config
│   └── api/
│       ├── events.js        # Event API functions
│       └── businesses.js    # Business API functions
```

## Cost

**Supabase Free Tier includes:**
- 500MB database
- 1GB storage
- 2GB bandwidth
- Unlimited API requests
- 500k auth users

**Perfect for launch and first 10k users!**

## Questions?

Check `SUPABASE_SETUP.md` for detailed troubleshooting.
