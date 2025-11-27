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
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Invalid or missing Authorization header');
      throw new Error('Invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const supabaseClient = supabaseAdmin;

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('JWT verification failed:', userError?.message);
      throw new Error(`Authentication failed: ${userError?.message || 'Invalid token'}`);
    }

    console.log('Authenticated user:', user.id);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('system_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.system_admin) {
      console.error('User is not system admin:', user.id);
      throw new Error('System admin access required');
    }

    console.log('System admin verified');

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

    const districtCache = new Map<string, string>();
    const stateCache = new Map<string, number>();

    const BATCH_SIZE = 50;
    
    for (let batchStart = 0; batchStart < schools.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, schools.length);
      const batch = schools.slice(batchStart, batchEnd);
      
      console.log(`Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: rows ${batchStart + 2} to ${batchEnd + 1}`);
      
      for (let i = 0; i < batch.length; i++) {
        const school = batch[i];
        const rowNum = batchStart + i + 2;

        try {
          if (!school.school_name?.trim()) {
            result.errors.push({
              row: rowNum,
              school_name: school.school_name || 'N/A',
              error: 'School name is required',
            });
            continue;
          }

          let districtId: string | null = null;
          if (school.school_district?.trim() && school.state?.trim()) {
            const districtKey = `${school.school_district.trim()}|${school.state.trim()}`;
            
            if (districtCache.has(districtKey)) {
              districtId = districtCache.get(districtKey)!;
            } else {
              let stateId: number | null = null;
              const stateCode = school.state.trim().toUpperCase();
              
              if (stateCache.has(stateCode)) {
                stateId = stateCache.get(stateCode)!;
              } else {
                const { data: stateData } = await supabaseClient
                  .from('states')
                  .select('id')
                  .eq('state_code', stateCode)
                  .single();
                
                if (stateData) {
                  stateId = stateData.id;
                  stateCache.set(stateCode, stateId);
                }
              }
              
              if (!stateId) {
                console.error(`State not found: ${stateCode}`);
                result.errors.push({
                  row: rowNum,
                  school_name: school.school_name,
                  error: `State not found: ${stateCode}`,
                });
                continue;
              }
              
              const { data: existingDistrict } = await supabaseClient
                .from('school_districts')
                .select('id')
                .eq('name', school.school_district.trim())
                .eq('state_id', stateId)
                .single();

              if (existingDistrict) {
                districtId = existingDistrict.id;
                districtCache.set(districtKey, districtId);
              } else {
                const { data: newDistrict, error: districtError } = await supabaseClient
                  .from('school_districts')
                  .insert({
                    name: school.school_district.trim(),
                    state_id: stateId,
                  })
                  .select('id')
                  .single();

                if (districtError) {
                  console.error(`Error creating district ${school.school_district}:`, districtError);
                  result.errors.push({
                    row: rowNum,
                    school_name: school.school_name,
                    error: `Failed to create district: ${districtError.message}`,
                  });
                  continue;
                } else if (newDistrict) {
                  districtId = newDistrict.id;
                  districtCache.set(districtKey, districtId);
                  result.districtsCreated++;
                }
              }
            }
          }

          const { data: existingSchools } = await supabaseClient
            .from('schools')
            .select('id, organization_id')
            .eq('school_name', school.school_name.trim())
            .eq('city', school.city?.trim() || '')
            .eq('state', school.state?.trim() || '');

          if (existingSchools && existingSchools.length > 0) {
            if (updateExisting) {
              const existingSchool = existingSchools[0];

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
      
      console.log(`Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} complete: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`);
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
