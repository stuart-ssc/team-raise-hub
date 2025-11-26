-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact forms (public insert)
CREATE POLICY "Anyone can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Only system admins can view contact submissions
CREATE POLICY "System admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (is_system_admin(auth.uid()));

-- Only system admins can update contact submissions
CREATE POLICY "System admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
TO authenticated
USING (is_system_admin(auth.uid()));

-- Create index for performance
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();