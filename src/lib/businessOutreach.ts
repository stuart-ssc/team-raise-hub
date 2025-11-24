import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessOutreachQueueItem {
  id: string;
  business_id: string;
  organization_id: string;
  priority_score: number;
  partnership_health_status: 'excellent' | 'good' | 'needs_attention' | 'at_risk' | 'critical';
  expansion_potential_level: 'high' | 'medium' | 'low';
  recommended_outreach_date: string;
  recommended_outreach_target: 'business_entity' | 'primary_contact' | 'specific_contact';
  specific_contact_id: string | null;
  queue_insights: {
    engagement_assessment: string;
    partnership_opportunities: string[];
    key_contacts_strategy: {
      primary_contact: string;
      total_contacts: number;
      recommended_target: string;
    };
    optimal_timing_rationale: string;
    suggested_messaging_approach: string;
    next_best_actions: string[];
    metrics: {
      linked_donor_count: number;
      total_partnership_value: number;
      days_since_last_activity: number;
      engagement_breadth_score: number;
      engagement_vitality_score: number;
      engagement_performance_score: number;
    };
    ai_generated_insights?: string;
  };
  generated_at: string;
  actioned_at: string | null;
  actioned_by: string | null;
  created_at: string;
  updated_at: string;
}

export const markBusinessContacted = async (queueItemId: string, businessId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update queue item
    const { error: updateError } = await supabase
      .from('business_outreach_queue')
      .update({
        actioned_at: new Date().toISOString(),
        actioned_by: user.id
      })
      .eq('id', queueItemId);

    if (updateError) throw updateError;

    // Log activity
    const { error: logError } = await supabase
      .from('business_activity_log')
      .insert({
        business_id: businessId,
        activity_type: 'outreach_completed',
        activity_data: {
          completed_at: new Date().toISOString(),
          completed_by: user.id
        }
      });

    if (logError) throw logError;

    toast.success('Marked as contacted');
    return true;
  } catch (error) {
    console.error('Error marking business as contacted:', error);
    toast.error('Failed to mark as contacted');
    return false;
  }
};

export const getContactTarget = (queueItem: BusinessOutreachQueueItem): string => {
  const { recommended_outreach_target, queue_insights } = queueItem;
  
  if (recommended_outreach_target === 'business_entity') {
    return 'Business entity (general outreach)';
  } else if (recommended_outreach_target === 'primary_contact') {
    return `Primary Contact: ${queue_insights.key_contacts_strategy.primary_contact}`;
  } else {
    return 'Specific stakeholder (see details)';
  }
};

export const getHealthStatusInfo = (status: string) => {
  switch (status) {
    case 'excellent':
      return {
        color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
        icon: '✨',
        label: 'Excellent',
        description: 'Thriving partnership with strong engagement'
      };
    case 'good':
      return {
        color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
        icon: '👍',
        label: 'Good',
        description: 'Healthy partnership with regular engagement'
      };
    case 'needs_attention':
      return {
        color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950',
        icon: '⚠️',
        label: 'Needs Attention',
        description: 'Partnership showing signs of declining engagement'
      };
    case 'at_risk':
      return {
        color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950',
        icon: '⚡',
        label: 'At Risk',
        description: 'Partnership at risk of becoming dormant'
      };
    case 'critical':
      return {
        color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950',
        icon: '🚨',
        label: 'Critical',
        description: 'Partnership requires immediate attention'
      };
    default:
      return {
        color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950',
        icon: '•',
        label: status,
        description: 'Unknown status'
      };
  }
};

export const getPriorityBadgeColor = (score: number): string => {
  if (score >= 80) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950';
  if (score >= 60) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950';
  return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950';
};

export const getExpansionPotentialInfo = (level: string) => {
  switch (level) {
    case 'high':
      return {
        color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
        icon: '📈',
        label: 'High Potential'
      };
    case 'medium':
      return {
        color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
        icon: '📊',
        label: 'Medium Potential'
      };
    case 'low':
      return {
        color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950',
        icon: '📉',
        label: 'Low Potential'
      };
    default:
      return {
        color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950',
        icon: '•',
        label: level
      };
  }
};