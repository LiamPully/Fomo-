-- Fomo Markets Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#E8783A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, color) VALUES
    ('Market', '#E8783A'),
    ('Event', '#4A82C4'),
    ('Fun', '#E8783A'),
    ('Other', '#888880')
ON CONFLICT (name) DO NOTHING;

-- Profiles table (for ALL users - customers and business owners)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'User',
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'event_goer',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table (additional data for business accounts)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
    status VARCHAR(20) DEFAULT 'published', -- published, draft, past, removed
    featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved events table (for customers to save/favorite events)
CREATE TABLE IF NOT EXISTS saved_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(area);
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_user ON saved_events(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read-only)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT USING (true);

-- Note: Only admins should modify categories
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
CREATE POLICY "Only admins can delete categories"
    ON categories FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for businesses
DROP POLICY IF EXISTS "Businesses are viewable by everyone" ON businesses;
CREATE POLICY "Businesses are viewable by everyone"
    ON businesses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own business" ON businesses;
CREATE POLICY "Users can insert their own business"
    ON businesses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own business" ON businesses;
CREATE POLICY "Users can update their own business"
    ON businesses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own business" ON businesses;
CREATE POLICY "Users can delete their own business"
    ON businesses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for events
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
CREATE POLICY "Published events are viewable by everyone"
    ON events FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Business owners can view all their events" ON events;
CREATE POLICY "Business owners can view all their events"
    ON events FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Business owners can insert events" ON events;
CREATE POLICY "Business owners can insert events"
    ON events FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Business owners can update their events" ON events;
CREATE POLICY "Business owners can update their events"
    ON events FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Business owners can delete their events" ON events;
CREATE POLICY "Business owners can delete their events"
    ON events FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for saved_events
DROP POLICY IF EXISTS "Users can view their own saved events" ON saved_events;
CREATE POLICY "Users can view their own saved events"
    ON saved_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save events" ON saved_events;
CREATE POLICY "Users can save events"
    ON saved_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave events" ON saved_events;
CREATE POLICY "Users can unsave events"
    ON saved_events FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Function to auto-create profile record on user signup
-- This runs AFTER INSERT on auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
    user_business_name TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    user_role := COALESCE(NEW.raw_user_meta_data->>'user_type', 'event_goer');
    user_business_name := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');

    -- Create profile record for ALL users
    INSERT INTO profiles (user_id, name, email, role)
    VALUES (NEW.id, user_name, NEW.email, user_role);

    -- Create business only for organisers
    IF user_role = 'organiser' THEN
        INSERT INTO businesses (user_id, business_name, email, event_count)
        VALUES (NEW.id, user_business_name, NEW.email, 0);
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log warning but do not block auth user creation
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to auto-create profile on auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user role
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate role
    IF new_role NOT IN ('customer', 'business') THEN
        RAISE EXCEPTION 'Invalid role. Must be customer or business';
    END IF;

    -- Update profile
    UPDATE profiles
    SET role = new_role
    WHERE user_id = target_user_id;

    -- Update auth user metadata
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(new_role::text)
    )
    WHERE id = target_user_id;

    RETURN FOUND;
END;
$$ language 'plpgsql' SECURITY DEFINER;

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
