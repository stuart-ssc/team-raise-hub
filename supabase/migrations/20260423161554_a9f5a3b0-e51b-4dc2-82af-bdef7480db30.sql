-- Enrollments table: one per (campaign, donor)
CREATE TABLE public.fundraiser_outreach_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  enrolled_by_user_id UUID NOT NULL,
  enrolled_by_organization_user_id UUID REFERENCES public.organization_user(id) ON DELETE SET NULL,
  student_organization_user_id UUID REFERENCES public.organization_user(id) ON DELETE SET NULL,
  roster_member_id UUID,
  roster_member_slug TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','stopped','unsubscribed')),
  completion_reason TEXT CHECK (completion_reason IN ('donated','campaign_ended','unsubscribed','suppressed','manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, donor_id)
);

CREATE INDEX idx_fro_enrollments_org ON public.fundraiser_outreach_enrollments(organization_id);
CREATE INDEX idx_fro_enrollments_campaign ON public.fundraiser_outreach_enrollments(campaign_id);
CREATE INDEX idx_fro_enrollments_donor ON public.fundraiser_outreach_enrollments(donor_id);
CREATE INDEX idx_fro_enrollments_status ON public.fundraiser_outreach_enrollments(status) WHERE status = 'active';

-- Sends table: one per scheduled email
CREATE TABLE public.fundraiser_outreach_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.fundraiser_outreach_enrollments(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('intro','weekly','final_week','final_48h','last_chance')),
  scheduled_send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','skipped','failed')),
  skip_reason TEXT,
  resend_email_id TEXT,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fro_sends_enrollment ON public.fundraiser_outreach_sends(enrollment_id);
CREATE INDEX idx_fro_sends_due ON public.fundraiser_outreach_sends(scheduled_send_at) WHERE status = 'scheduled';
CREATE UNIQUE INDEX idx_fro_sends_unsubscribe_token ON public.fundraiser_outreach_sends(unsubscribe_token);

-- Updated_at trigger for enrollments
CREATE TRIGGER trg_fro_enrollments_updated_at
  BEFORE UPDATE ON public.fundraiser_outreach_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.fundraiser_outreach_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraiser_outreach_sends ENABLE ROW LEVEL SECURITY;

-- Enrollments: org admins and program managers can read
CREATE POLICY "Org admins and managers can view enrollments"
  ON public.fundraiser_outreach_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_user ou
      JOIN public.user_type ut ON ut.id = ou.user_type_id
      WHERE ou.user_id = auth.uid()
        AND ou.organization_id = fundraiser_outreach_enrollments.organization_id
        AND ou.active_user = true
        AND ut.permission_level IN ('organization_admin','program_manager')
    )
  );

-- Sends: visible if user can see parent enrollment
CREATE POLICY "Org admins and managers can view sends"
  ON public.fundraiser_outreach_sends
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fundraiser_outreach_enrollments e
      JOIN public.organization_user ou ON ou.organization_id = e.organization_id
      JOIN public.user_type ut ON ut.id = ou.user_type_id
      WHERE e.id = fundraiser_outreach_sends.enrollment_id
        AND ou.user_id = auth.uid()
        AND ou.active_user = true
        AND ut.permission_level IN ('organization_admin','program_manager')
    )
  );