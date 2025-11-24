import { supabase } from "@/integrations/supabase/client";

export interface BusinessWithInsights {
  id: string;
  business_name: string;
  business_email: string | null;
  engagement_segment: string | null;
  engagement_score: number | null;
  linked_donors_count: number | null;
  last_donor_activity_date: string | null;
  total_partnership_value: number | null;
  logo_url: string | null;
  insights?: {
    expansion_potential: string | null;
    priority_score: number | null;
    partnership_health_score: number | null;
    risk_level: string | null;
  } | null;
  queue_data?: {
    partnership_health_status: string | null;
  } | null;
  enrollment_status?: string | null;
  enrollment_count?: number;
}

export interface CampaignTriggerConfig {
  health_status?: string[];
  expansion_potential?: string[];
  priority_score_min?: number;
  days_since_activity_min?: number;
}

export interface MatchResult {
  matches: boolean;
  reasons: string[];
  warnings: string[];
  score: number; // 0-100
}

export function calculateDaysSince(dateString: string | null): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function doesBusinessMatchCampaign(
  business: BusinessWithInsights,
  triggerConfig: CampaignTriggerConfig
): MatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let matchCount = 0;
  let totalCriteria = 0;

  // Health Status Check (from queue data or risk level)
  if (triggerConfig.health_status && triggerConfig.health_status.length > 0) {
    totalCriteria++;
    const healthStatus = business.queue_data?.partnership_health_status || business.insights?.risk_level;
    if (healthStatus && triggerConfig.health_status.includes(healthStatus)) {
      matchCount++;
      reasons.push(`✓ Health status: ${healthStatus}`);
    } else {
      warnings.push(`✗ Health status: ${healthStatus || "unknown"} (requires: ${triggerConfig.health_status.join(", ")})`);
    }
  }

  // Expansion Potential Check
  if (triggerConfig.expansion_potential && triggerConfig.expansion_potential.length > 0) {
    totalCriteria++;
    const expansion = business.insights?.expansion_potential;
    if (expansion && triggerConfig.expansion_potential.includes(expansion)) {
      matchCount++;
      reasons.push(`✓ Expansion potential: ${expansion}`);
    } else {
      warnings.push(`✗ Expansion potential: ${expansion || "unknown"} (requires: ${triggerConfig.expansion_potential.join(", ")})`);
    }
  }

  // Priority Score Check
  if (triggerConfig.priority_score_min !== undefined && triggerConfig.priority_score_min !== null) {
    totalCriteria++;
    const priorityScore = business.insights?.priority_score || 0;
    if (priorityScore >= triggerConfig.priority_score_min) {
      matchCount++;
      reasons.push(`✓ Priority score: ${priorityScore} (min: ${triggerConfig.priority_score_min})`);
    } else {
      warnings.push(`✗ Priority score: ${priorityScore} (requires min: ${triggerConfig.priority_score_min})`);
    }
  }

  // Days Since Activity Check
  if (triggerConfig.days_since_activity_min !== undefined && triggerConfig.days_since_activity_min !== null) {
    totalCriteria++;
    const daysSince = calculateDaysSince(business.last_donor_activity_date);
    if (daysSince >= triggerConfig.days_since_activity_min) {
      matchCount++;
      reasons.push(`✓ Last activity: ${daysSince === Infinity ? "Never" : `${daysSince} days ago`}`);
    } else {
      warnings.push(`✗ Last activity: ${daysSince} days ago (requires min: ${triggerConfig.days_since_activity_min})`);
    }
  }

  const matches = totalCriteria === 0 || matchCount === totalCriteria;
  const score = totalCriteria > 0 ? Math.round((matchCount / totalCriteria) * 100) : 100;

  return { matches, reasons, warnings, score };
}

export async function getMatchingBusinesses(
  organizationId: string,
  campaignId: string
): Promise<BusinessWithInsights[]> {
  // Get campaign trigger config
  const { data: campaign } = await supabase
    .from("business_nurture_campaigns")
    .select("trigger_config")
    .eq("id", campaignId)
    .single();

  if (!campaign) return [];

  const triggerConfig = campaign.trigger_config as CampaignTriggerConfig;

  // Get all businesses with insights
  const { data: orgBusinesses } = await supabase
    .from("organization_businesses")
    .select("business_id")
    .eq("organization_id", organizationId);

  if (!orgBusinesses || orgBusinesses.length === 0) return [];

  const businessIds = orgBusinesses.map((ob) => ob.business_id);

  const { data: businesses } = await supabase
    .from("businesses")
    .select(`
      id,
      business_name,
      business_email,
      engagement_segment,
      engagement_score,
      linked_donors_count,
      last_donor_activity_date,
      total_partnership_value,
      logo_url
    `)
    .in("id", businessIds)
    .is("archived_at", null);

  if (!businesses) return [];

  // Get insights for all businesses
  const { data: insights } = await supabase
    .from("business_insights")
    .select(`
      business_id,
      expansion_potential,
      priority_score,
      partnership_health_score,
      risk_level
    `)
    .in("business_id", businessIds);

  // Get queue data for health status
  const { data: queueData } = await supabase
    .from("business_outreach_queue")
    .select("business_id, partnership_health_status")
    .in("business_id", businessIds);

  // Get enrollment status
  const { data: enrollments } = await supabase
    .from("business_nurture_enrollments")
    .select("business_id, status")
    .eq("campaign_id", campaignId)
    .in("business_id", businessIds)
    .order("enrolled_at", { ascending: false });

  // Merge data
  const businessesWithInsights: BusinessWithInsights[] = businesses.map((business) => {
    const insight = insights?.find((i) => i.business_id === business.id);
    const queue = queueData?.find((q) => q.business_id === business.id);
    const enrollment = enrollments?.find((e) => e.business_id === business.id);

    return {
      ...business,
      insights: insight || null,
      queue_data: queue ? { partnership_health_status: queue.partnership_health_status } : null,
      enrollment_status: enrollment?.status || null,
      enrollment_count: enrollments?.filter((e) => e.business_id === business.id).length || 0,
    };
  });

  // Filter matching businesses
  return businessesWithInsights.filter((business) => {
    const match = doesBusinessMatchCampaign(business, triggerConfig);
    return match.matches;
  });
}

export async function getAllBusinessesWithMatchInfo(
  organizationId: string,
  campaignId: string
): Promise<(BusinessWithInsights & { matchResult: MatchResult })[]> {
  // Get campaign trigger config
  const { data: campaign } = await supabase
    .from("business_nurture_campaigns")
    .select("trigger_config")
    .eq("id", campaignId)
    .single();

  if (!campaign) return [];

  const triggerConfig = campaign.trigger_config as CampaignTriggerConfig;

  // Get all businesses with insights (same as above)
  const { data: orgBusinesses } = await supabase
    .from("organization_businesses")
    .select("business_id")
    .eq("organization_id", organizationId);

  if (!orgBusinesses || orgBusinesses.length === 0) return [];

  const businessIds = orgBusinesses.map((ob) => ob.business_id);

  const { data: businesses } = await supabase
    .from("businesses")
    .select(`
      id,
      business_name,
      business_email,
      engagement_segment,
      engagement_score,
      linked_donors_count,
      last_donor_activity_date,
      total_partnership_value,
      logo_url
    `)
    .in("id", businessIds)
    .is("archived_at", null);

  if (!businesses) return [];

  const { data: insights } = await supabase
    .from("business_insights")
    .select(`
      business_id,
      expansion_potential,
      priority_score,
      partnership_health_score,
      risk_level
    `)
    .in("business_id", businessIds);

  const { data: queueData } = await supabase
    .from("business_outreach_queue")
    .select("business_id, partnership_health_status")
    .in("business_id", businessIds);

  const { data: enrollments } = await supabase
    .from("business_nurture_enrollments")
    .select("business_id, status")
    .eq("campaign_id", campaignId)
    .in("business_id", businessIds)
    .order("enrolled_at", { ascending: false });

  return businesses.map((business) => {
    const insight = insights?.find((i) => i.business_id === business.id);
    const queue = queueData?.find((q) => q.business_id === business.id);
    const enrollment = enrollments?.find((e) => e.business_id === business.id);

    const businessWithInsights: BusinessWithInsights = {
      ...business,
      insights: insight || null,
      queue_data: queue ? { partnership_health_status: queue.partnership_health_status } : null,
      enrollment_status: enrollment?.status || null,
      enrollment_count: enrollments?.filter((e) => e.business_id === business.id).length || 0,
    };

    const matchResult = doesBusinessMatchCampaign(businessWithInsights, triggerConfig);

    return {
      ...businessWithInsights,
      matchResult,
    };
  });
}
