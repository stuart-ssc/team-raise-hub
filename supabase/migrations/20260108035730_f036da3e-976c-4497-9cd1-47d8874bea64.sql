-- Create help_submissions table
CREATE TABLE public.help_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('support', 'bug', 'feature')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  browser_info TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.help_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "Users can create their own submissions" ON public.help_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON public.help_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- System admins can do everything
CREATE POLICY "System admins have full access" ON public.help_submissions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_admin = true)
  );

-- Indexes for faster queries
CREATE INDEX idx_help_submissions_user_id ON public.help_submissions(user_id);
CREATE INDEX idx_help_submissions_status ON public.help_submissions(status);
CREATE INDEX idx_help_submissions_type ON public.help_submissions(submission_type);
CREATE INDEX idx_help_submissions_created_at ON public.help_submissions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_help_submissions_updated_at
  BEFORE UPDATE ON public.help_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();