import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, previewToken } = await req.json();

    if (!slug || typeof slug !== 'string' || !previewToken || typeof previewToken !== 'string' || !UUID_RE.test(previewToken)) {
      return new Response(
        JSON.stringify({ error: 'slug and previewToken are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: campaign, error: campaignError } = await admin
      .from('campaigns')
      .select(`
        *,
        groups!inner(
          id,
          organization_id,
          group_name,
          group_type(id, name),
          schools(id, school_name, city, state, "Primary Color")
        ),
        campaign_type(id, name)
      `)
      .eq('slug', slug)
      .eq('preview_token', previewToken)
      .maybeSingle();

    if (campaignError) {
      console.error('preview lookup error:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Lookup failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Preview link is invalid' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: items } = await admin
      .from('campaign_items')
      .select('*')
      .eq('campaign_id', campaign.id);

    const itemIds = (items || []).filter((i: any) => i.has_variants).map((i: any) => i.id);
    let variants: any[] = [];
    if (itemIds.length > 0) {
      const { data: v } = await admin
        .from('campaign_item_variants')
        .select('*')
        .in('campaign_item_id', itemIds)
        .order('display_order', { ascending: true });
      variants = v || [];
    }
    const itemsWithVariants = (items || []).map((it: any) => ({
      ...it,
      variants: variants.filter((v: any) => v.campaign_item_id === it.id),
    }));

    const { data: customFields } = await admin
      .from('campaign_custom_fields')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('display_order', { ascending: true });

    return new Response(
      JSON.stringify({
        campaign,
        items: itemsWithVariants,
        customFields: customFields || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('get-campaign-preview error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});