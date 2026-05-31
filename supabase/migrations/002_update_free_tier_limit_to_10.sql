-- Update free tier lead limit from 1 to 10
-- This trigger enforces the limit at the database level

CREATE OR REPLACE FUNCTION public.check_free_tier_lead_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plan TEXT;
  lead_count BIGINT;
BEGIN
  SELECT plan INTO current_plan FROM profiles WHERE id = NEW.user_id;
  IF current_plan = 'free' THEN
    SELECT COUNT(*) INTO lead_count FROM leads WHERE user_id = NEW.user_id AND is_active = true;
    IF lead_count >= 10 THEN
      RAISE EXCEPTION 'Free tier limited to 10 active leads. Upgrade to Pro for unlimited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
