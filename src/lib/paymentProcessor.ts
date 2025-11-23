import { supabase } from "@/integrations/supabase/client";

export interface PaymentProcessorConfig {
  processor: 'pending' | string;
  account_id: string | null;
  account_enabled: boolean;
  additional_config?: Record<string, any>;
}

export interface PaymentAccount {
  organizationId?: string;
  groupId?: string;
  config: PaymentProcessorConfig;
  source: 'organization' | 'group';
}

export const getPaymentAccount = async (groupId: string): Promise<PaymentAccount | null> => {
  const { data: group } = await supabase
    .from('groups')
    .select('id, organization_id, use_org_payment_account, payment_processor_config')
    .eq('id', groupId)
    .single();
    
  if (!group) return null;
  
  // If group uses org account, fetch org config
  if (group.use_org_payment_account) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, payment_processor_config')
      .eq('id', group.organization_id)
      .single();
      
    return org ? {
      organizationId: org.id,
      config: (org.payment_processor_config as unknown) as PaymentProcessorConfig,
      source: 'organization'
    } : null;
  }
  
  // Otherwise use group-level config
  return {
    groupId: group.id,
    config: ((group.payment_processor_config as unknown) as PaymentProcessorConfig) || { 
      processor: 'pending', 
      account_id: null, 
      account_enabled: false 
    },
    source: 'group'
  };
};

export const isPaymentAccountConfigured = (config: PaymentProcessorConfig): boolean => {
  return config.processor !== 'pending' && config.account_enabled === true;
};
