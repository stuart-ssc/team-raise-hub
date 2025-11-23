import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DonorImportRow {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tags?: string[];
  notes?: string;
  preferred_communication?: string;
}

interface ImportRequest {
  organizationId: string;
  donors: DonorImportRow[];
  updateExisting: boolean;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; email: string; error: string }>;
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

    const { organizationId, donors, updateExisting }: ImportRequest = await req.json();

    if (!organizationId || !donors || !Array.isArray(donors)) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting import of ${donors.length} donors for organization ${organizationId}`);

    // Verify user has permission to import donors for this organization
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
        JSON.stringify({ error: "Insufficient permissions to import donors" }),
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

    // Process each donor
    for (let i = 0; i < donors.length; i++) {
      const donor = donors[i];
      const rowNumber = i + 1;

      try {
        // Validate email
        if (!donor.email || !isValidEmail(donor.email)) {
          result.errors.push({
            row: rowNumber,
            email: donor.email || "missing",
            error: "Invalid or missing email address",
          });
          result.skipped++;
          continue;
        }

        // Check if donor already exists
        const { data: existingDonor, error: checkError } = await supabase
          .from("donor_profiles")
          .select("id, email")
          .eq("email", donor.email.toLowerCase().trim())
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking donor ${donor.email}:`, checkError);
          result.errors.push({
            row: rowNumber,
            email: donor.email,
            error: "Database error checking for duplicate",
          });
          result.skipped++;
          continue;
        }

        if (existingDonor) {
          if (updateExisting) {
            // Update existing donor
            const updateData: any = {
              updated_at: new Date().toISOString(),
            };

            if (donor.first_name) updateData.first_name = donor.first_name.trim();
            if (donor.last_name) updateData.last_name = donor.last_name.trim();
            if (donor.phone) updateData.phone = donor.phone.trim();
            if (donor.tags && donor.tags.length > 0) updateData.tags = donor.tags;
            if (donor.notes) updateData.notes = donor.notes.trim();
            if (donor.preferred_communication) {
              updateData.preferred_communication = donor.preferred_communication;
            }

            const { error: updateError } = await supabase
              .from("donor_profiles")
              .update(updateData)
              .eq("id", existingDonor.id);

            if (updateError) {
              console.error(`Error updating donor ${donor.email}:`, updateError);
              result.errors.push({
                row: rowNumber,
                email: donor.email,
                error: "Failed to update existing donor",
              });
              result.skipped++;
            } else {
              result.updated++;
            }
          } else {
            result.skipped++;
          }
        } else {
          // Insert new donor
          const insertData: any = {
            organization_id: organizationId,
            email: donor.email.toLowerCase().trim(),
            first_name: donor.first_name?.trim() || null,
            last_name: donor.last_name?.trim() || null,
            phone: donor.phone?.trim() || null,
            tags: donor.tags && donor.tags.length > 0 ? donor.tags : null,
            notes: donor.notes?.trim() || null,
            preferred_communication: donor.preferred_communication || "email",
          };

          const { error: insertError } = await supabase
            .from("donor_profiles")
            .insert(insertData);

          if (insertError) {
            console.error(`Error inserting donor ${donor.email}:`, insertError);
            result.errors.push({
              row: rowNumber,
              email: donor.email,
              error: "Failed to insert new donor",
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
          email: donor.email || "unknown",
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
    console.error("Error in import-donors function:", error);
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
