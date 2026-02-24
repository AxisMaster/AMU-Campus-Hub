-- Run this in your Supabase SQL Editor

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- The user receiving the notification
  type TEXT NOT NULL CHECK (type IN ('event_approved', 'event_rejected', 'new_event')),
  message TEXT NOT NULL,
  event_id TEXT, -- References the event (using TEXT because event ids in the app are currently strings)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add user_id to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Create the trigger function
CREATE OR REPLACE FUNCTION handle_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: An event is approved (Status changed from false to true)
  IF TG_OP = 'UPDATE' AND OLD.is_approved = false AND NEW.is_approved = true THEN
    
    -- Notify the creator that their event was approved
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, message, event_id)
      VALUES (NEW.user_id, 'event_approved', 'Your event "' || NEW.title || '" has been approved!', NEW.id);
    END IF;

    -- Broadcast to all other users that a new event is available
    INSERT INTO notifications (user_id, type, message, event_id)
    SELECT id, 'new_event', 'New event published: ' || NEW.title, NEW.id
    FROM profiles
    WHERE id != NEW.user_id OR NEW.user_id IS NULL;

  -- Case 2: An event is rejected/deleted (Optional, if you delete unapproved events)
  ELSIF TG_OP = 'DELETE' AND OLD.is_approved = false THEN
    IF OLD.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, message, event_id)
      VALUES (OLD.user_id, 'event_rejected', 'Your event "' || OLD.title || '" was not approved.', OLD.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger on the events table
DROP TRIGGER IF EXISTS event_notifications_trigger ON events;
CREATE TRIGGER event_notifications_trigger
  AFTER UPDATE OR DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_event_notifications();
