-- ============================================================
-- AMU Campus Hub: Full Auth & RLS Setup
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- 1. Create Profiles Table (synced with Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url TEXT,
  department TEXT,
  hall TEXT,
  club TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Events Table (if not already existing, or recreate with proper schema)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  venue TEXT NOT NULL,
  category TEXT DEFAULT 'Cultural',
  image_url TEXT,
  organizer TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_by TEXT, -- email of creator
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_link TEXT,
  social_link TEXT,
  entry_fee TEXT,
  expected_audience TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Saved Events Table
CREATE TABLE IF NOT EXISTS saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- 4. Create Notifications Table (if not already existing)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event_approved', 'event_rejected', 'new_event')),
  message TEXT NOT NULL,
  event_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================
-- 5. Enable Row Level Security on ALL tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. RLS Policies for PROFILES
-- ============================================================

-- Anyone can read profiles (for displaying user names, etc.)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for the trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- 7. RLS Policies for EVENTS
-- ============================================================

-- EVERYONE (including anonymous/non-logged-in) can READ approved events
DROP POLICY IF EXISTS "Anyone can view approved events" ON events;
CREATE POLICY "Anyone can view approved events"
  ON events FOR SELECT
  USING (is_approved = true);

-- Admins can view ALL events (including unapproved)
DROP POLICY IF EXISTS "Admins can view all events" ON events;
CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Logged-in users can create events (INSERT)
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can UPDATE events (approve/edit)
DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can delete events (reject)
DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ============================================================
-- 8. RLS Policies for SAVED_EVENTS
-- ============================================================

-- Users can view their own saved events
DROP POLICY IF EXISTS "Users can view their own saved events" ON saved_events;
CREATE POLICY "Users can view their own saved events"
  ON saved_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save events
DROP POLICY IF EXISTS "Users can save events" ON saved_events;
CREATE POLICY "Users can save events"
  ON saved_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own events
DROP POLICY IF EXISTS "Users can unsave their own events" ON saved_events;
CREATE POLICY "Users can unsave their own events"
  ON saved_events FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 9. RLS Policies for NOTIFICATIONS
-- ============================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================
-- 10. Auto-create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 11. Notification trigger (when events are approved/rejected)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Event approved
  IF TG_OP = 'UPDATE' AND OLD.is_approved = false AND NEW.is_approved = true THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, message, event_id)
      VALUES (NEW.user_id, 'event_approved', 'Your event "' || NEW.title || '" has been approved!', NEW.id);
    END IF;
  -- Event rejected (deleted while unapproved)
  ELSIF TG_OP = 'DELETE' AND OLD.is_approved = false THEN
    IF OLD.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, message, event_id)
      VALUES (OLD.user_id, 'event_rejected', 'Your event "' || OLD.title || '" was not approved.', OLD.id);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS event_notifications_trigger ON events;
CREATE TRIGGER event_notifications_trigger
  AFTER UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_notifications();


-- ============================================================
-- DONE! Your database is now ready.
-- Next steps:
--   1. Go to Authentication > Settings in Supabase Dashboard
--   2. Enable "Email" provider (disable "Confirm email" for testing)
--   3. To make a user an admin, run:
--      UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- ============================================================
