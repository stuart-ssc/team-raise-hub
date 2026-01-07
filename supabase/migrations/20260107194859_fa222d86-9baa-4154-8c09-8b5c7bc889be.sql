-- Create table for parent/guardian invitations
CREATE TABLE public.parent_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_organization_user_id UUID NOT NULL REFERENCES public.organization_user(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  relationship TEXT DEFAULT 'Guardian',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  roster_id BIGINT REFERENCES public.rosters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.parent_invitations ENABLE ROW LEVEL SECURITY;

-- Index for faster token lookups
CREATE INDEX idx_parent_invitations_token ON public.parent_invitations(token);
CREATE INDEX idx_parent_invitations_inviter ON public.parent_invitations(inviter_organization_user_id);
CREATE INDEX idx_parent_invitations_status ON public.parent_invitations(status);

-- Policy: Players can insert invitations for themselves
CREATE POLICY "Players can create their own invitations"
ON public.parent_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  inviter_organization_user_id IN (
    SELECT id FROM public.organization_user 
    WHERE user_id = auth.uid() AND active_user = true
  )
);

-- Policy: Players can view their own invitations
CREATE POLICY "Players can view their own invitations"
ON public.parent_invitations
FOR SELECT
TO authenticated
USING (
  inviter_organization_user_id IN (
    SELECT id FROM public.organization_user 
    WHERE user_id = auth.uid() AND active_user = true
  )
);

-- Policy: Players can update (cancel) their own invitations
CREATE POLICY "Players can update their own invitations"
ON public.parent_invitations
FOR UPDATE
TO authenticated
USING (
  inviter_organization_user_id IN (
    SELECT id FROM public.organization_user 
    WHERE user_id = auth.uid() AND active_user = true
  )
);

-- Policy: Org admins can view all invitations for their organization
CREATE POLICY "Admins can view organization invitations"
ON public.parent_invitations
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_user 
    WHERE user_id = auth.uid() 
      AND active_user = true 
      AND user_type_id IN (SELECT id FROM public.user_type WHERE name IN ('Admin', 'Coach'))
  )
);

-- Policy: Allow anonymous read for token validation during signup
CREATE POLICY "Anyone can validate invitation tokens"
ON public.parent_invitations
FOR SELECT
TO anon
USING (true);