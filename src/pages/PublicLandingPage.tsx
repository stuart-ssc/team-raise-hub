import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LandingPageRenderer } from '@/components/LandingPageEditor/LandingPageRenderer';
import { buildTemplateVariables } from '@/components/LandingPageEditor/resolveTemplateVariables';
import { useEntityStats } from '@/hooks/useEntityStats';
import { LandingPageBlock } from '@/components/LandingPageEditor/types';
import NotFound from './NotFound';
import { HelmetProvider } from 'react-helmet-async';

interface PublicLandingPageProps {
  entityType: 'school' | 'district';
}

interface SchoolEntity {
  id: string;
  school_name: string;
  city: string | null;
  state: string | null;
  street_address: string | null;
  logo_file: string | null;
  slug: string | null;
}

interface DistrictEntity {
  id: string;
  name: string;
  state: string | null;
  slug: string | null;
}

type Entity = SchoolEntity | DistrictEntity;

export default function PublicLandingPage({ entityType }: PublicLandingPageProps) {
  const { state, slug } = useParams<{ state: string; slug: string }>();

  // Fetch entity by state and slug
  const { data: entity, isLoading: entityLoading, error: entityError } = useQuery({
    queryKey: ['public-entity', entityType, state, slug],
    queryFn: async (): Promise<Entity | null> => {
      if (!state || !slug) return null;

      const stateUpper = state.toUpperCase();

      if (entityType === 'school') {
        const { data, error } = await supabase
          .from('schools')
          .select('id, school_name, city, state, street_address, logo_file, slug')
          .eq('state', stateUpper)
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        return data as SchoolEntity | null;
      } else {
        const { data, error } = await supabase
          .from('school_districts')
          .select('id, name, state, slug')
          .eq('state', stateUpper)
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;
        return data as DistrictEntity | null;
      }
    },
    enabled: !!state && !!slug,
  });

  // Fetch landing page config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['public-landing-config', entityType, entity?.id],
    queryFn: async () => {
      if (!entity?.id) return null;

      const { data, error } = await supabase
        .from('landing_page_configs')
        .select(`
          *,
          template:landing_page_templates(*)
        `)
        .eq('entity_id', entity.id)
        .eq('entity_type', entityType)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!entity?.id,
  });

  // Fetch default template if no config exists
  const { data: defaultTemplate } = useQuery({
    queryKey: ['default-template', entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('template_type', entityType)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!entity && !config,
  });

  // Fetch real stats
  const { data: stats } = useEntityStats(entityType, entity?.id || null);

  // Determine which template and blocks to use
  const template = config?.template || defaultTemplate;
  const blocks: LandingPageBlock[] = (template?.blocks as unknown as LandingPageBlock[]) || [];

  // Build variables
  const variables = React.useMemo(() => {
    if (!entity) return {};

    const entityData = entityType === 'school' 
      ? {
          name: (entity as SchoolEntity).school_name,
          city: (entity as SchoolEntity).city || undefined,
          state: entity.state || undefined,
          address_line1: (entity as SchoolEntity).street_address || undefined,
          logo_url: (entity as SchoolEntity).logo_file || undefined,
        }
      : {
          name: (entity as DistrictEntity).name,
          state: entity.state || undefined,
        };

    const overrides = (config?.variable_overrides as Record<string, unknown>) || {};

    return buildTemplateVariables(entityType, entityData, stats || {}, overrides);
  }, [entity, entityType, stats, config]);

  // Loading state
  if (entityLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Entity not found
  if (!entity || entityError) {
    return <NotFound />;
  }

  // No template available - show basic info
  if (!template || blocks.length === 0) {
    return (
      <HelmetProvider>
        <BasicEntityPage entity={entity} entityType={entityType} stats={stats} />
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <LandingPageRenderer
        blocks={blocks}
        variables={variables}
        seoTitle={config?.seo_title || undefined}
        seoDescription={config?.seo_description || undefined}
        ogImageUrl={config?.og_image_url || undefined}
      />
    </HelmetProvider>
  );
}

// Basic fallback page when no template is configured
function BasicEntityPage({ 
  entity, 
  entityType,
  stats 
}: { 
  entity: Entity; 
  entityType: 'school' | 'district';
  stats?: { total_raised?: number; campaign_count?: number; supporter_count?: number; group_count?: number };
}) {
  const name = entityType === 'school' ? (entity as SchoolEntity).school_name : (entity as DistrictEntity).name;
  const city = entityType === 'school' ? (entity as SchoolEntity).city : null;
  const location = [city, entity.state].filter(Boolean).join(', ');
  const logoUrl = entityType === 'school' ? (entity as SchoolEntity).logo_file : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-16 px-6 text-center">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={name}
            className="w-24 h-24 mx-auto mb-6 rounded-full object-cover bg-white"
          />
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{name}</h1>
        {location && (
          <p className="text-xl opacity-90">{location}</p>
        )}
      </header>

      {/* Stats */}
      {stats && (
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-background p-6 rounded-xl text-center shadow-sm">
              <div className="text-3xl font-bold text-primary">
                ${((stats.total_raised || 0) / 100).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
            </div>
            <div className="bg-background p-6 rounded-xl text-center shadow-sm">
              <div className="text-3xl font-bold text-primary">{stats.campaign_count || 0}</div>
              <div className="text-sm text-muted-foreground">Campaigns</div>
            </div>
            <div className="bg-background p-6 rounded-xl text-center shadow-sm">
              <div className="text-3xl font-bold text-primary">{stats.supporter_count || 0}</div>
              <div className="text-sm text-muted-foreground">Supporters</div>
            </div>
            <div className="bg-background p-6 rounded-xl text-center shadow-sm">
              <div className="text-3xl font-bold text-primary">{stats.group_count || 0}</div>
              <div className="text-sm text-muted-foreground">Groups</div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-muted-foreground text-sm border-t">
        <p>Powered by <a href="/" className="text-primary hover:underline">Sponsorly</a></p>
      </footer>
    </div>
  );
}
