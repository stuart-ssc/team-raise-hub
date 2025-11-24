import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessImportRow {
  business_name: string;
  ein?: string;
  industry?: string;
  business_email?: string;
  business_phone?: string;
  website_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface ImportRequest {
  organizationId: string;
  businesses: BusinessImportRow[];
  updateExisting: boolean;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; businessName: string; error: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { organizationId, businesses, updateExisting }: ImportRequest = await req.json();

    if (!organizationId || !businesses || !Array.isArray(businesses)) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting import of ${businesses.length} businesses for organization ${organizationId}`);

    // Verify user has permission to import businesses for this organization
    const { data: orgUser, error: orgError } = await supabase
      .from("organization_user")
      .select("user_type_id, user_type!inner(permission_level)")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (orgError || !orgUser) {
      return new Response(
        JSON.stringify({ error: "User does not belong to this organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const permissionLevel = (orgUser as any).user_type?.permission_level;
    if (!["organization_admin", "program_manager"].includes(permissionLevel)) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions to import businesses" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // Process each business
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      const rowNumber = i + 1;

      try {
        // Validate business name
        if (!business.business_name || business.business_name.trim().length === 0) {
          result.errors.push({
            row: rowNumber,
            businessName: business.business_name || "missing",
            error: "Business name is required",
          });
          result.skipped++;
          continue;
        }

        const businessName = business.business_name.trim();

        // Check if business already exists (by name + organization)
        const { data: existingBusinessLink, error: checkError } = await supabase
          .from("organization_businesses")
          .select(`
            business_id,
            businesses!inner(
              id,
              business_name
            )
          `)
          .eq("organization_id", organizationId)
          .ilike("businesses.business_name", businessName)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking business ${businessName}:`, checkError);
          result.errors.push({
            row: rowNumber,
            businessName,
            error: "Database error checking for duplicate",
          });
          result.skipped++;
          continue;
        }

        if (existingBusinessLink) {
          if (updateExisting) {
            // Update existing business
            const updateData: any = {
              updated_at: new Date().toISOString(),
            };

            if (business.ein) updateData.ein = business.ein.trim();
            if (business.industry) updateData.industry = business.industry.trim();
            if (business.business_email) {
              if (isValidEmail(business.business_email)) {
                updateData.business_email = business.business_email.trim();
              } else {
                result.errors.push({
                  row: rowNumber,
                  businessName,
                  error: "Invalid email format",
                });
                result.skipped++;
                continue;
              }
            }
            if (business.business_phone) updateData.business_phone = business.business_phone.trim();
            if (business.website_url) updateData.website_url = business.website_url.trim();
            if (business.address_line1) updateData.address_line1 = business.address_line1.trim();
            if (business.address_line2) updateData.address_line2 = business.address_line2.trim();
            if (business.city) updateData.city = business.city.trim();
            if (business.state) updateData.state = business.state.trim();
            if (business.zip) updateData.zip = business.zip.trim();
            if (business.country) updateData.country = business.country.trim();

            const { error: updateError } = await supabase
              .from("businesses")
              .update(updateData)
              .eq("id", existingBusinessLink.business_id);

            if (updateError) {
              console.error(`Error updating business ${businessName}:`, updateError);
              result.errors.push({
                row: rowNumber,
                businessName,
                error: "Failed to update existing business",
              });
              result.skipped++;
            } else {
              result.updated++;
            }
          } else {
            result.skipped++;
          }
        } else {
          // Validate email if provided
          if (business.business_email && !isValidEmail(business.business_email)) {
            result.errors.push({
              row: rowNumber,
              businessName,
              error: "Invalid email format",
            });
            result.skipped++;
            continue;
          }

          // Insert new business
          const insertData: any = {
            business_name: businessName,
            ein: business.ein?.trim() || null,
            industry: business.industry?.trim() || null,
            business_email: business.business_email?.trim() || null,
            business_phone: business.business_phone?.trim() || null,
            website_url: business.website_url?.trim() || null,
            address_line1: business.address_line1?.trim() || null,
            address_line2: business.address_line2?.trim() || null,
            city: business.city?.trim() || null,
            state: business.state?.trim() || null,
            zip: business.zip?.trim() || null,
            country: business.country?.trim() || "US",
            verification_status: "pending",
          };

          const { data: newBusiness, error: insertError } = await supabase
            .from("businesses")
            .insert(insertData)
            .select()
            .single();

          if (insertError) {
            console.error(`Error inserting business ${businessName}:`, insertError);
            result.errors.push({
              row: rowNumber,
              businessName,
              error: "Failed to insert new business",
            });
            result.skipped++;
            continue;
          }

          // Link business to organization
          const { error: linkError } = await supabase
            .from("organization_businesses")
            .insert({
              organization_id: organizationId,
              business_id: newBusiness.id,
              relationship_status: "active",
            });

          if (linkError) {
            console.error(`Error linking business ${businessName}:`, linkError);
            // Delete the business since we couldn't link it
            await supabase.from("businesses").delete().eq("id", newBusiness.id);
            result.errors.push({
              row: rowNumber,
              businessName,
              error: "Failed to link business to organization",
            });
            result.skipped++;
          } else {
            result.imported++;
          }
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          businessName: business.business_name || "unknown",
          error: error.message || "Unknown error",
        });
        result.skipped++;
      }
    }

    console.log(`Import completed: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in import-businesses function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
