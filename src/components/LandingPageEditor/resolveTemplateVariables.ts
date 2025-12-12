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

// List of style properties that may contain template variables
const TEXT_STYLE_PROPERTIES = [
  'buttonUrl',
  'buttonText',
  'heroTitle',
  'heroSubtitle',
  'ctaTitle',
  'ctaDescription',
  'ctaButtonText',
  'ctaButtonUrl',
  'testimonialQuote',
  'testimonialAuthor',
  'testimonialRole',
  'pricingTitle',
  'pricingSubtitle',
  'pricingDescription',
  'pricingHighlight',
  'campaignListTitle',
  'contactTitle',
  'contactEmail',
  'contactPhone',
  'contactAddress',
] as const;

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
    const resolvedStyles = { ...resolved.styles } as Record<string, unknown>;
    
    // Resolve all text style properties
    for (const prop of TEXT_STYLE_PROPERTIES) {
      if (prop in resolvedStyles && typeof resolvedStyles[prop] === 'string') {
        resolvedStyles[prop] = resolveVariableString(resolvedStyles[prop] as string, variables);
      }
    }
    
    // Resolve nested arrays (features, steps, stats)
    if ('features' in resolvedStyles && Array.isArray(resolvedStyles.features)) {
      resolvedStyles.features = (resolvedStyles.features as Array<{ title?: string; description?: string; icon?: string }>).map(f => ({
        ...f,
        title: f.title ? resolveVariableString(f.title, variables) : f.title,
        description: f.description ? resolveVariableString(f.description, variables) : f.description,
      }));
    }
    
    if ('steps' in resolvedStyles && Array.isArray(resolvedStyles.steps)) {
      resolvedStyles.steps = (resolvedStyles.steps as Array<{ title?: string; description?: string }>).map(s => ({
        ...s,
        title: s.title ? resolveVariableString(s.title, variables) : s.title,
        description: s.description ? resolveVariableString(s.description, variables) : s.description,
      }));
    }
    
    if ('stats' in resolvedStyles && Array.isArray(resolvedStyles.stats)) {
      resolvedStyles.stats = (resolvedStyles.stats as Array<{ label?: string; value?: string }>).map(stat => ({
        ...stat,
        label: stat.label ? resolveVariableString(stat.label, variables) : stat.label,
        value: stat.value ? resolveVariableString(stat.value, variables) : stat.value,
      }));
    }
    
    resolved.styles = resolvedStyles;
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
