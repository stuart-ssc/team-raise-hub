-- Create a security definer function to check if a user has purchased from a campaign
-- associated with a specific group
CREATE OR REPLACE FUNCTION public.has_purchased_from_group(
  _user_id uuid,
  _group_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM orders o
    JOIN campaigns c ON o.campaign_id = c.id
    WHERE o.user_id = _user_id
      AND o.status IN ('succeeded', 'pending')
      AND c.group_id = _group_id
  )
$$;

-- Add RLS policy to allow donors to view group leaders for campaigns they purchased from
CREATE POLICY "Donors can view group leaders for campaigns they purchased from"
ON public.organization_user
FOR SELECT
TO authenticated
USING (
  public.has_purchased_from_group(auth.uid(), group_id)
);