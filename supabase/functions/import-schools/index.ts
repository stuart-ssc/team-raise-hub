import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchoolImportRow {
  school_name: string;
  school_district?: string;
  county?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  zipcode_4_digit?: string;
  phone_number?: string;
}

interface ImportRequest {
  schools: SchoolImportRow[];
  updateExisting: boolean;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  districtsCreated: number;
  errors: Array<{ row: number; school_name: string; error: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    console.log('Authorization header starts with Bearer:', authHeader?.startsWith('Bearer '));
    
    if (!authHeader) {
      console.error('No Authorization header found');
      throw new Error('No Authorization header provided');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated and get user info
    console.log('Attempting to get user from JWT...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('Auth error:', userError.message, userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    if (!user) {
      console.error('No user found in session');
      throw new Error('No authenticated user');
    }

    console.log('Authenticated user:', user.id);

    // Verify user is system admin using service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('system_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.system_admin) {
      console.error('User is not system admin:', user.id);
      throw new Error('System admin access required');
    }

    console.log('System admin verified:', user.id);

    const { schools, updateExisting }: ImportRequest = await req.json();

    if (!schools || !Array.isArray(schools)) {
      throw new Error('Invalid request: schools array required');
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      districtsCreated: 0,
      errors: [],
    };

    // District cache to avoid repeated lookups: "district_name|state" -> district_id
    const districtCache = new Map<string, string>();

    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      const rowNum = i + 2; // Account for header row

      try {
        // Validate required field
        if (!school.school_name?.trim()) {
          result.errors.push({
            row: rowNum,
            school_name: school.school_name || 'N/A',
            error: 'School name is required',
          });
          continue;
        }

        // Handle district lookup/creation if district name provided
        let districtId: string | null = null;
        if (school.school_district?.trim() && school.state?.trim()) {
          const districtKey = `${school.school_district.trim()}|${school.state.trim()}`;
          
          // Check cache first
          if (districtCache.has(districtKey)) {
            districtId = districtCache.get(districtKey)!;
          } else {
            // Query for existing district
            const { data: existingDistrict } = await supabaseClient
              .from('school_districts')
              .select('id')
              .eq('name', school.school_district.trim())
              .eq('state_id', school.state.trim())
              .single();

            if (existingDistrict) {
              districtId = existingDistrict.id;
              districtCache.set(districtKey, districtId);
            } else {
              // Create new district
              const { data: newDistrict, error: districtError } = await supabaseClient
                .from('school_districts')
                .insert({
                  name: school.school_district.trim(),
                  state_id: school.state.trim(),
                })
                .select('id')
                .single();

              if (districtError) {
                console.error(`Error creating district ${school.school_district}:`, districtError);
              } else if (newDistrict) {
                districtId = newDistrict.id;
                districtCache.set(districtKey, districtId);
                result.districtsCreated++;
              }
            }
          }
        }

        // Check for existing school (by name + city + state)
        const { data: existingSchools } = await supabaseClient
          .from('schools')
          .select('id, organization_id')
          .eq('school_name', school.school_name.trim())
          .eq('city', school.city?.trim() || '')
          .eq('state', school.state?.trim() || '');

        if (existingSchools && existingSchools.length > 0) {
          // School already exists
          if (updateExisting) {
            const existingSchool = existingSchools[0];

            // Update organization record
            const { error: orgUpdateError } = await supabaseClient
              .from('organizations')
              .update({
                name: school.school_name.trim(),
                city: school.city?.trim() || null,
                state: school.state?.trim() || null,
                zip: school.zipcode?.trim() || null,
                phone: school.phone_number?.trim() || null,
                address_line1: school.street_address?.trim() || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSchool.organization_id);

            if (orgUpdateError) throw orgUpdateError;

            // Update school record
            const { error: schoolUpdateError } = await supabaseClient
              .from('schools')
              .update({
                school_name: school.school_name.trim(),
                district_name: school.school_district?.trim() || null,
                school_district_id: districtId,
                county_name: school.county?.trim() || null,
                street_address: school.street_address?.trim() || null,
                city: school.city?.trim() || null,
                state: school.state?.trim() || null,
                zip: school.zipcode?.trim() || null,
                zip_4_digit: school.zipcode_4_digit?.trim() || null,
                phone: school.phone_number?.trim() || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSchool.id);

            if (schoolUpdateError) throw schoolUpdateError;

            result.updated++;
          } else {
            result.skipped++;
          }
          continue;
        }

        // Create new organization first
        const { data: newOrg, error: orgError } = await supabaseClient
          .from('organizations')
          .insert({
            organization_type: 'school',
            name: school.school_name.trim(),
            city: school.city?.trim() || null,
            state: school.state?.trim() || null,
            zip: school.zipcode?.trim() || null,
            phone: school.phone_number?.trim() || null,
            address_line1: school.street_address?.trim() || null,
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // Create school record linked to organization
        const { error: schoolError } = await supabaseClient
          .from('schools')
          .insert({
            organization_id: newOrg.id,
            school_name: school.school_name.trim(),
            district_name: school.school_district?.trim() || null,
            school_district_id: districtId,
            county_name: school.county?.trim() || null,
            street_address: school.street_address?.trim() || null,
            city: school.city?.trim() || null,
            state: school.state?.trim() || null,
            zip: school.zipcode?.trim() || null,
            zip_4_digit: school.zipcode_4_digit?.trim() || null,
            phone: school.phone_number?.trim() || null,
            school_subtype: 'public',
          });

        if (schoolError) throw schoolError;

        result.imported++;

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        result.errors.push({
          row: rowNum,
          school_name: school.school_name || 'Unknown',
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
