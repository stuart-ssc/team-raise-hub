-- Create email A/B testing tables
CREATE TABLE IF NOT EXISTS email_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  email_type TEXT NOT NULL DEFAULT 'annual_tax_summary',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, completed, archived
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  minimum_sample_size INTEGER NOT NULL DEFAULT 100,
  winner_variant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES email_ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  template_data JSONB, -- Store template-specific customizations
  is_control BOOLEAN DEFAULT false,
  split_percentage INTEGER DEFAULT 50, -- For future support of multi-variant tests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(test_id, name)
);

CREATE TABLE IF NOT EXISTS email_ab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES email_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES email_ab_variants(id) ON DELETE CASCADE,
  email_log_id UUID NOT NULL REFERENCES email_delivery_log(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(email_log_id) -- Each email can only be part of one test
);

-- Add RLS policies
ALTER TABLE email_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ab_results ENABLE ROW LEVEL SECURITY;

-- System admins can manage A/B tests
CREATE POLICY "System admins can manage A/B tests"
  ON email_ab_tests
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "System admins can manage variants"
  ON email_ab_variants
  FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "System admins can view results"
  ON email_ab_results
  FOR SELECT
  USING (is_system_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_email_ab_tests_status ON email_ab_tests(status);
CREATE INDEX idx_email_ab_variants_test_id ON email_ab_variants(test_id);
CREATE INDEX idx_email_ab_results_test_id ON email_ab_results(test_id);
CREATE INDEX idx_email_ab_results_variant_id ON email_ab_results(variant_id);
CREATE INDEX idx_email_ab_results_email_log_id ON email_ab_results(email_log_id);

-- Function to get A/B test results with statistics
CREATE OR REPLACE FUNCTION get_ab_test_results(test_uuid UUID)
RETURNS TABLE(
  variant_id UUID,
  variant_name TEXT,
  subject_line TEXT,
  is_control BOOLEAN,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_clicked BIGINT,
  open_rate NUMERIC,
  click_rate NUMERIC,
  click_through_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as variant_id,
    v.name as variant_name,
    v.subject_line,
    v.is_control,
    COUNT(r.id) as emails_sent,
    COUNT(CASE WHEN l.opened_at IS NOT NULL THEN 1 END) as emails_opened,
    COUNT(CASE WHEN l.clicked_at IS NOT NULL THEN 1 END) as emails_clicked,
    CASE 
      WHEN COUNT(r.id) > 0 
      THEN ROUND((COUNT(CASE WHEN l.opened_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(r.id)::NUMERIC) * 100, 2)
      ELSE 0 
    END as open_rate,
    CASE 
      WHEN COUNT(r.id) > 0 
      THEN ROUND((COUNT(CASE WHEN l.clicked_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(r.id)::NUMERIC) * 100, 2)
      ELSE 0 
    END as click_rate,
    CASE 
      WHEN COUNT(CASE WHEN l.opened_at IS NOT NULL THEN 1 END) > 0 
      THEN ROUND((COUNT(CASE WHEN l.clicked_at IS NOT NULL THEN 1 END)::NUMERIC / COUNT(CASE WHEN l.opened_at IS NOT NULL THEN 1 END)::NUMERIC) * 100, 2)
      ELSE 0 
    END as click_through_rate
  FROM email_ab_variants v
  LEFT JOIN email_ab_results r ON v.id = r.variant_id
  LEFT JOIN email_delivery_log l ON r.email_log_id = l.id
  WHERE v.test_id = test_uuid
  GROUP BY v.id, v.name, v.subject_line, v.is_control
  ORDER BY v.is_control DESC, v.name;
END;
$$;

-- Add comment explaining A/B test workflow
COMMENT ON TABLE email_ab_tests IS 'A/B tests for email campaigns with automatic variant selection and statistical analysis';
COMMENT ON TABLE email_ab_variants IS 'Email variants for A/B testing including subject lines and template customizations';
COMMENT ON TABLE email_ab_results IS 'Links email delivery logs to A/B test variants for performance tracking';
