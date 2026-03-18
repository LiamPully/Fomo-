# Database Setup Instructions

## Quick Setup (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Run the Migration
1. Open `supabase-migration.sql` in your code editor
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click "Run"

### Step 3: Verify the Setup
Run this query in the SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('businesses', 'events', 'categories');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('businesses', 'events', 'categories');

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';
```

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db execute --file supabase-migration.sql
```

## What Gets Created

### Tables
- `categories` - Event categories (Market, Event, Fun, Other)
- `businesses` - Business profiles linked to auth.users
- `events` - Event listings with full details

### Security
- Row Level Security (RLS) enabled on all tables
- Policies for public read access
- Policies for business owners to manage their data
- Admin-only category modification

### Triggers
- Auto-update `updated_at` timestamps
- Auto-create business record on user signup
- Auto-maintain `event_count` on business

### Constraints
- Email format validation
- Password strength (enforced in app)
- Event time ordering (end > start)
- Coordinate ranges (lat: -90 to 90, lng: -180 to 180)
- Enum validation for status fields

## Troubleshooting

### "relation already exists" errors
The migration uses `IF NOT EXISTS` and `DROP IF EXISTS`, so it's safe to run multiple times.

### RLS not working
Make sure you're testing with an authenticated user. Anonymous users can only read published events and public business info.

### Triggers not firing
Check that the trigger functions were created successfully:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'handle_new_user%';
```

## Next Steps

1. **Test the app** - Create an account and try publishing an event
2. **Check RLS** - Verify users can only modify their own data
3. **Set up Google Places API** - Restrict the API key in Google Cloud Console
4. **Configure CSP** - Add your domain to allowed sources in `vite.config.js`

## Need Help?

- Check the [SECURITY.md](./SECURITY.md) for security details
- Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for connection info
- Check Supabase logs in the Dashboard if queries fail
