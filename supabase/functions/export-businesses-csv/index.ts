import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  businessIds: string[];
  columns: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { businessIds, columns }: ExportRequest = await req.json();

    if (!businessIds || businessIds.length === 0) {
      throw new Error('No business IDs provided');
    }

    if (!columns || columns.length === 0) {
      throw new Error('No columns provided');
    }

    // Fetch business data with the specified columns
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select(columns.join(', '))
      .in('id', businessIds);

    if (fetchError) {
      console.error('Error fetching businesses:', fetchError);
      throw new Error(`Failed to fetch businesses: ${fetchError.message}`);
    }

    // Generate CSV header
    const csvHeader = columns.map(col => 
      col.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(',');

    // Generate CSV rows
    const csvRows = businesses.map(business => {
      return columns.map(col => {
        const value = business[col];
        
        if (value === null || value === undefined) {
          return '';
        }
        
        if (Array.isArray(value)) {
          return `"${value.join(', ')}"`;
        }
        
        if (typeof value === 'number') {
          return value;
        }
        
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    }).join('\n');

    const csv = `${csvHeader}\n${csvRows}`;

    return new Response(
      JSON.stringify({ 
        csv, 
        count: businesses.length 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Error in export-businesses-csv:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
