-- Signup attempts table (idempotent — file already in repo from prior run but never applied)
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  invite_sent_at TIMESTAMPTZ,
  invite_sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signup_attempts_email_idx ON public.signup_attempts (lower(email));
CREATE INDEX IF NOT EXISTS signup_attempts_created_at_idx ON public.signup_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS signup_attempts_completed_at_idx ON public.signup_attempts (completed_at);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System admins can view signup attempts" ON public.signup_attempts;
CREATE POLICY "System admins can view signup attempts"
  ON public.signup_attempts FOR SELECT
  TO authenticated
  USING (public.is_system_admin(auth.uid()));

DROP POLICY IF EXISTS "System admins can update signup attempts" ON public.signup_attempts;
CREATE POLICY "System admins can update signup attempts"
  ON public.signup_attempts FOR UPDATE
  TO authenticated
  USING (public.is_system_admin(auth.uid()))
  WITH CHECK (public.is_system_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.mark_signup_attempt_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  IF user_email IS NOT NULL THEN
    UPDATE public.signup_attempts
       SET completed_at = COALESCE(completed_at, now()),
           updated_at = now()
     WHERE lower(email) = lower(user_email)
       AND completed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_signup_attempt_completed_after_profile_insert ON public.profiles;
CREATE TRIGGER mark_signup_attempt_completed_after_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.mark_signup_attempt_completed();

-- Link email_delivery_log to a specific invited user (nullable, only used for invitation emails)
ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS email_delivery_log_invitation_lookup_idx
  ON public.email_delivery_log (email_type, recipient_email, sent_at DESC);

CREATE INDEX IF NOT EXISTS email_delivery_log_invited_user_idx
  ON public.email_delivery_log (invited_user_id)
  WHERE invited_user_id IS NOT NULL;