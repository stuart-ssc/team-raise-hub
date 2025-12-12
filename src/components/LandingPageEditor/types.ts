export type LandingPageBlockType = 
  | 'hero' 
  | 'heading' 
  | 'paragraph' 
  | 'button' 
  | 'image' 
  | 'divider' 
  | 'spacer'
  | 'stats-row'
  | 'cta-box'
  | 'testimonial'
  | 'campaign-list'
  | 'contact-info'
  | 'two-column'
  | 'feature-grid'
  | 'how-it-works'
  | 'pricing-highlight';

export interface LandingPageBlock {
  id: string;
  type: LandingPageBlockType;
  content: string;
  styles: {
    // Common
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    textAlign?: 'left' | 'center' | 'right';
    
    // Hero specific
    heroTitle?: string;
    heroSubtitle?: string;
    heroBackgroundImage?: string;
    heroBackgroundColor?: string;
    heroHeight?: string;
    heroOverlayOpacity?: string;
    
    // Heading/Paragraph
    fontSize?: string;
    fontWeight?: string;
    
    // Button
    buttonText?: string;
    buttonUrl?: string;
    buttonColor?: string;
    buttonVariant?: 'solid' | 'outline' | 'ghost';
    
    // Image
    imageUrl?: string;
    imageAlt?: string;
    imageWidth?: string;
    
    // Spacer
    spacerHeight?: string;
    
    // Stats row
    stats?: Array<{
      label: string;
      value: string;
      icon?: string;
    }>;
    
    // CTA box
    ctaTitle?: string;
    ctaDescription?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
    
    // Testimonial
    testimonialQuote?: string;
    testimonialAuthor?: string;
    testimonialRole?: string;
    testimonialImage?: string;
    
    // Campaign list
    campaignListTitle?: string;
    campaignListLimit?: number;
    
    // Contact info
    showAddress?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showWebsite?: boolean;
    
    // Two column
    leftColumnContent?: LandingPageBlock[];
    rightColumnContent?: LandingPageBlock[];
    columnRatio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70';
    
    // Feature grid (marketing)
    features?: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    featureColumns?: 2 | 3 | 4;
    
    // How it works (marketing)
    steps?: Array<{
      stepNumber: number;
      title: string;
      description: string;
    }>;
    
    // Pricing highlight (marketing)
    pricingTitle?: string;
    pricingSubtitle?: string;
    pricingHighlight?: string;
    pricingDescription?: string;
  };
}

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: 'school' | 'district' | 'nonprofit';
  blocks: LandingPageBlock[];
  preview_image_url: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandingPageConfig {
  id: string;
  template_id: string;
  entity_type: 'school' | 'district' | 'nonprofit';
  entity_id: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  variable_overrides: Record<string, string>;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
}

// Template variables available for substitution
export interface TemplateVariables {
  // School variables
  school_name?: string;
  school_city?: string;
  school_state?: string;
  school_address?: string;
  school_phone?: string;
  school_type?: string;
  school_students?: number;
  school_teachers?: number;
  
  // District variables
  district_name?: string;
  district_school_count?: number;
  district_total_students?: number;
  
  // Computed stats
  total_raised?: number;
  total_raised_formatted?: string;
  campaign_count?: number;
  active_campaign_count?: number;
  supporter_count?: number;
  group_count?: number;
  
  // Organization variables
  organization_name?: string;
  organization_email?: string;
  organization_phone?: string;
  organization_website?: string;
  organization_logo?: string;
  
  // Meta
  current_year?: number;
}

export const AVAILABLE_VARIABLES: { category: string; variables: { key: string; label: string; example: string }[] }[] = [
  {
    category: 'School',
    variables: [
      { key: 'school_name', label: 'School Name', example: 'Lincoln High School' },
      { key: 'school_city', label: 'City', example: 'Springfield' },
      { key: 'school_state', label: 'State', example: 'IL' },
      { key: 'school_address', label: 'Street Address', example: '123 Main St' },
      { key: 'school_phone', label: 'Phone Number', example: '(555) 123-4567' },
      { key: 'school_type', label: 'School Type', example: 'High School' },
      { key: 'school_students', label: 'Student Count', example: '1,250' },
      { key: 'school_teachers', label: 'Teacher Count', example: '75' },
    ],
  },
  {
    category: 'District',
    variables: [
      { key: 'district_name', label: 'District Name', example: 'Springfield School District' },
      { key: 'district_school_count', label: 'Number of Schools', example: '15' },
      { key: 'district_total_students', label: 'Total Students', example: '12,500' },
    ],
  },
  {
    category: 'Statistics',
    variables: [
      { key: 'total_raised', label: 'Total Raised (number)', example: '25000' },
      { key: 'total_raised_formatted', label: 'Total Raised (formatted)', example: '$25,000' },
      { key: 'campaign_count', label: 'Total Campaigns', example: '8' },
      { key: 'active_campaign_count', label: 'Active Campaigns', example: '3' },
      { key: 'supporter_count', label: 'Total Supporters', example: '450' },
      { key: 'group_count', label: 'Number of Groups', example: '12' },
    ],
  },
  {
    category: 'Organization',
    variables: [
      { key: 'organization_name', label: 'Organization Name', example: 'Lincoln PTO' },
      { key: 'organization_email', label: 'Email', example: 'info@lincolnpto.org' },
      { key: 'organization_phone', label: 'Phone', example: '(555) 123-4567' },
      { key: 'organization_website', label: 'Website', example: 'https://lincolnpto.org' },
      { key: 'organization_logo', label: 'Logo URL', example: '/logo.png' },
    ],
  },
  {
    category: 'Meta',
    variables: [
      { key: 'current_year', label: 'Current Year', example: '2025' },
    ],
  },
  {
    category: 'Marketing',
    variables: [
      { key: 'signup_url', label: 'Sign Up URL', example: '/signup' },
      { key: 'contact_url', label: 'Contact URL', example: '/contact' },
      { key: 'platform_name', label: 'Platform Name', example: 'Sponsorly' },
    ],
  },
];
