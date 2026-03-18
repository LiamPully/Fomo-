# Supabase Setup Guide for Fomo Markets

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose:
   - **Organization:** Your org (or create new)
   - **Project name:** `fomo-markets`
   - **Database password:** Generate a strong password (save it!)
   - **Region:** Choose closest to South Africa (EU West recommended)
4. Click "Create new project" (takes ~2 minutes)

## Step 2: Get API Keys

Once project is ready:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdef123456.supabase.co`)
   - **anon public** API key (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase values:
   ```env
   VITE_SUPABASE_URL=https://your-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_GOOGLE_PLACES_API_KEY=your-google-places-key
   ```

## Step 4: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste everything from `supabase-schema.sql`
4. Click "Run" (creates tables, indexes, RLS policies)

## Step 5: Seed Sample Data

1. In SQL Editor, create another new query
2. Copy and paste everything from `supabase-seed.sql`
3. Click "Run" (adds sample events and businesses)

## Step 6: Enable Auth Providers (Optional)

For Google sign-in:

1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials (or skip for now, use email auth)

## Step 7: Test Connection

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open browser console - you should see no Supabase errors

## Step 8: Storage Setup (For Images)

1. Go to **Storage** in Supabase dashboard
2. Click "New bucket"
3. Name: `event-images`
4. Set to **Public**
5. Click "Create policy" → "For full customization" → "INSERT"
6. Policy name: `Allow authenticated uploads`
7. Allowed operation: `INSERT`
8. Target roles: `authenticated`
9. Policy definition: `true`
10. Click "Review" → "Save policy"

## Troubleshooting

### "Failed to fetch" errors
- Check your `.env` values are correct
- Ensure no trailing slashes in URL
- Restart dev server after changing .env

### RLS policy errors
- Make sure you're logged in (or use service role key for admin operations)
- Check policies were created in SQL Editor

### CORS errors
- In Supabase: Settings → API → "Additional URLs"
- Add: `http://localhost:3000` and your production domain

## Next Steps

After Supabase is set up:
1. Update the React components to use the API functions
2. Replace mock data with real database calls
3. Test CRUD operations
4. Deploy to Vercel

## Production Checklist

Before going live:
- [ ] Enable Row Level Security (already done in schema)
- [ ] Set up proper auth policies
- [ ] Configure storage bucket permissions
- [ ] Add rate limiting (Supabase Pro)
- [ ] Set up database backups (automatic on Pro)
- [ ] Configure custom domain (optional)
