-- ============================================================
-- FOMO MARKETS DATABASE MIGRATION
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: Create Tables
-- ============================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#E8783A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table (for event creators)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    instagram VARCHAR(100),
    subscription_status VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    event_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    organiser VARCHAR(255),

    -- Location
    venue VARCHAR(255),
    area VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    website VARCHAR(255),
    instagram VARCHAR(100),

    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Media
    image_url VARCHAR(500),

    -- Status
    status VARCHAR(20) DEFAULT 'published',
    featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved events table (user bookmarks)
CREATE TABLE IF NOT EXISTS saved_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- ============================================================
-- STEP 2: Create Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(area);
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_status_start ON events(status, start_time) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured, status) WHERE featured = true AND status = 'published';

-- Saved events indexes
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event ON saved_events(event_id);

-- ============================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: RLS Policies for Businesses
-- ============================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Businesses are viewable by everyone" ON businesses;
DROP POLICY IF EXISTS "Users can insert their own business" ON businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON businesses;
DROP POLICY IF EXISTS "Users can delete their own business" ON businesses;

-- Businesses are viewable by everyone
CREATE POLICY "Businesses are viewable by everyone"
    ON businesses FOR SELECT USING (true);

-- Users can insert their own business
CREATE POLICY "Users can insert their own business"
    ON businesses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own business
CREATE POLICY "Users can update their own business"
    ON businesses FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own business
CREATE POLICY "Users can delete their own business"
    ON businesses FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STEP 5: RLS Policies for Events
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Business owners can view all their events" ON events;
DROP POLICY IF EXISTS "Business owners can insert events" ON events;
DROP POLICY IF EXISTS "Business owners can update their events" ON events;
DROP POLICY IF EXISTS "Business owners can delete their events" ON events;

-- Published events are viewable by everyone
CREATE POLICY "Published events are viewable by everyone"
    ON events FOR SELECT USING (status = 'published');

-- Business owners can view all their events (including drafts)
CREATE POLICY "Business owners can view all their events"
    ON events FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Business owners can insert events
CREATE POLICY "Business owners can insert events"
    ON events FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Business owners can update their events
CREATE POLICY "Business owners can update their events"
    ON events FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- Business owners can delete their events
CREATE POLICY "Business owners can delete their events"
    ON events FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- STEP 6: RLS Policies for Categories
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Only admins can delete categories"
    ON categories FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================
-- STEP 6b: RLS Policies for Saved Events
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own saved events" ON saved_events;
DROP POLICY IF EXISTS "Users can save events" ON saved_events;
DROP POLICY IF EXISTS "Users can unsave events" ON saved_events;

-- Users can only see their own saved events
CREATE POLICY "Users can view their own saved events"
    ON saved_events FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can save events
CREATE POLICY "Users can save events"
    ON saved_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own saves
CREATE POLICY "Users can unsave events"
    ON saved_events FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STEP 7: Create Functions and Triggers
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment event view count
CREATE OR REPLACE FUNCTION increment_event_view(event_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE events SET view_count = view_count + 1 WHERE id = event_id;
END;
$$ language 'plpgsql';

-- Function to auto-create business record on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO businesses (user_id, business_name, email, event_count)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
        NEW.email,
        0
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create business on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to maintain business event_count automatically
CREATE OR REPLACE FUNCTION update_business_event_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE businesses
        SET event_count = event_count + 1
        WHERE id = NEW.business_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE businesses
        SET event_count = GREATEST(0, event_count - 1)
        WHERE id = OLD.business_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically maintain event_count
DROP TRIGGER IF EXISTS maintain_business_event_count ON events;
CREATE TRIGGER maintain_business_event_count
    AFTER INSERT OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION update_business_event_count();

-- ============================================================
-- STEP 8: Add Data Integrity Constraints
-- ============================================================

-- CHECK constraints for enums
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS chk_subscription_status;
ALTER TABLE businesses ADD CONSTRAINT chk_subscription_status
    CHECK (subscription_status IN ('free', 'active', 'cancelled', 'expired'));

ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_event_status;
ALTER TABLE events ADD CONSTRAINT chk_event_status
    CHECK (status IN ('published', 'draft', 'past', 'removed'));

-- Latitude/Longitude range validation
ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_latitude_range;
ALTER TABLE events ADD CONSTRAINT chk_latitude_range
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_longitude_range;
ALTER TABLE events ADD CONSTRAINT chk_longitude_range
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Event time ordering
ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_event_time_order;
ALTER TABLE events ADD CONSTRAINT chk_event_time_order
    CHECK (end_time > start_time);

-- Color format validation for categories
ALTER TABLE categories DROP CONSTRAINT IF EXISTS chk_color_format;
ALTER TABLE categories ADD CONSTRAINT chk_color_format
    CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- ============================================================
-- STEP 9: Insert Default Categories
-- ============================================================

INSERT INTO categories (name, color) VALUES
    ('Market', '#E8783A'),
    ('Event', '#4A82C4'),
    ('Fun', '#E8783A'),
    ('Other', '#888880')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STEP 10: Verify Setup
-- ============================================================

-- Test that RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('businesses', 'events', 'categories', 'saved_events')
AND schemaname = 'public';

-- Count policies per table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'events', 'categories', 'saved_events')
ORDER BY tablename, policyname;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
