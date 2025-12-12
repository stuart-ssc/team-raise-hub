import { LandingPageBlock, TemplateVariables } from './types';

/**
 * Resolves template variables in a string
 * Replaces {{variable_name}} with actual values
 */
export function resolveVariableString(
  template: string,
  variables: Partial<TemplateVariables>
): string {
  if (!template) return template;
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key as keyof TemplateVariables];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    // Return placeholder if variable not found
    return match;
  });
}

/**
 * Resolves all template variables in landing page blocks
 */
export function resolveTemplateVariables(
  blocks: LandingPageBlock[],
  variables: Partial<TemplateVariables>
): LandingPageBlock[] {
  return blocks.map(block => resolveBlockVariables(block, variables));
}

function resolveBlockVariables(
  block: LandingPageBlock,
  variables: Partial<TemplateVariables>
): LandingPageBlock {
  const resolved: LandingPageBlock = { ...block };
  
  // Resolve content
  if (resolved.content) {
    resolved.content = resolveVariableString(resolved.content, variables);
  }
  
  // Resolve styles that might contain variables
  if (resolved.styles) {
    resolved.styles = { ...resolved.styles };
    
    // Button URL might have variables
    if ('buttonUrl' in resolved.styles && resolved.styles.buttonUrl) {
      resolved.styles.buttonUrl = resolveVariableString(
        resolved.styles.buttonUrl as string,
        variables
      );
    }
    
    // Button text might have variables
    if ('buttonText' in resolved.styles && resolved.styles.buttonText) {
      resolved.styles.buttonText = resolveVariableString(
        resolved.styles.buttonText as string,
        variables
      );
    }
  }
  
  return resolved;
}

/**
 * Build variables object from entity data and stats
 */
export function buildTemplateVariables(
  entityType: 'school' | 'district',
  entityData: {
    name?: string;
    city?: string;
    state?: string;
    address_line1?: string;
    website_url?: string;
    logo_url?: string;
  },
  stats: {
    total_raised?: number;
    campaign_count?: number;
    active_campaign_count?: number;
    supporter_count?: number;
    group_count?: number;
  } = {},
  overrides: Partial<TemplateVariables> = {}
): Partial<TemplateVariables> {
  const variables: Partial<TemplateVariables> = {
    // Entity variables
    ...(entityType === 'school' ? {
      school_name: entityData.name,
      school_city: entityData.city,
      school_state: entityData.state,
      school_address: entityData.address_line1,
      school_website: entityData.website_url,
      school_logo_url: entityData.logo_url,
    } : {
      district_name: entityData.name,
      district_city: entityData.city,
      district_state: entityData.state,
      district_website: entityData.website_url,
      district_logo_url: entityData.logo_url,
    }),
    
    // Computed stats
    total_raised: stats.total_raised ?? 0,
    campaign_count: stats.campaign_count ?? 0,
    active_campaign_count: stats.active_campaign_count ?? 0,
    supporter_count: stats.supporter_count ?? 0,
    group_count: stats.group_count ?? 0,
    
    // Apply overrides
    ...overrides,
  };
  
  return variables;
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
