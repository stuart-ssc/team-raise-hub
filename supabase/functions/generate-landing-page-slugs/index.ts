import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is system admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("system_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.system_admin) {
      return new Response(JSON.stringify({ error: "Forbidden - System admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entityType, batchSize = 1000 } = await req.json();

    let updatedCount = 0;
    let offset = 0;
    let hasMore = true;

    if (entityType === "schools" || entityType === "all") {
      console.log("Processing schools...");
      
      while (hasMore) {
        const { data: schools, error: schoolsError } = await supabase
          .from("schools")
          .select("id, school_name, city, state")
          .is("slug", null)
          .range(offset, offset + batchSize - 1);

        if (schoolsError) {
          console.error("Error fetching schools:", schoolsError);
          throw schoolsError;
        }

        if (!schools || schools.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processing ${schools.length} schools at offset ${offset}`);

        // Group by state for collision detection
        const schoolsByState: Record<string, typeof schools> = {};
        for (const school of schools) {
          const state = school.state || "unknown";
          if (!schoolsByState[state]) schoolsByState[state] = [];
          schoolsByState[state].push(school);
        }

        for (const [state, stateSchools] of Object.entries(schoolsByState)) {
          // Check existing slugs for this state
          const { data: existingSlugs } = await supabase
            .from("schools")
            .select("slug")
            .eq("state", state)
            .not("slug", "is", null);

          const usedSlugs = new Set(existingSlugs?.map(s => s.slug) || []);

          for (const school of stateSchools) {
            let baseSlug = generateSlug(school.school_name);
            
            // Add city for uniqueness
            if (school.city) {
              baseSlug = `${baseSlug}-${generateSlug(school.city)}`;
            }

            let slug = baseSlug;
            let counter = 1;

            while (usedSlugs.has(slug)) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }

            usedSlugs.add(slug);

            const { error: updateError } = await supabase
              .from("schools")
              .update({ slug })
              .eq("id", school.id);

            if (updateError) {
              console.error(`Error updating school ${school.id}:`, updateError);
            } else {
              updatedCount++;
            }
          }
        }

        offset += batchSize;
        
        if (schools.length < batchSize) {
          hasMore = false;
        }
      }
    }

    offset = 0;
    hasMore = true;

    if (entityType === "districts" || entityType === "all") {
      console.log("Processing districts...");
      
      while (hasMore) {
        const { data: districts, error: districtsError } = await supabase
          .from("school_districts")
          .select("id, name, state_id")
          .is("slug", null)
          .range(offset, offset + batchSize - 1);

        if (districtsError) {
          console.error("Error fetching districts:", districtsError);
          throw districtsError;
        }

        if (!districts || districts.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`Processing ${districts.length} districts at offset ${offset}`);

        // Get state abbreviations from states table
        const { data: states } = await supabase
          .from("states")
          .select("id, abbreviation");
        
        const stateMap = new Map(states?.map(s => [s.id, s.abbreviation]) || []);

        // Group by state for collision detection
        const districtsByState: Record<string, typeof districts> = {};
        for (const district of districts) {
          const state = stateMap.get(district.state_id) || "unknown";
          if (!districtsByState[state]) districtsByState[state] = [];
          districtsByState[state].push({ ...district, state });
        }

        for (const [state, stateDistricts] of Object.entries(districtsByState)) {
          // Check existing slugs for this state
          const { data: existingSlugs } = await supabase
            .from("school_districts")
            .select("slug")
            .eq("state", state)
            .not("slug", "is", null);

          const usedSlugs = new Set(existingSlugs?.map(s => s.slug) || []);

          for (const district of stateDistricts) {
            const baseSlug = generateSlug(district.name);
            let slug = baseSlug;
            let counter = 1;

            while (usedSlugs.has(slug)) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }

            usedSlugs.add(slug);

            // Update both slug and state
            const { error: updateError } = await supabase
              .from("school_districts")
              .update({ slug, state })
              .eq("id", district.id);

            if (updateError) {
              console.error(`Error updating district ${district.id}:`, updateError);
            } else {
              updatedCount++;
            }
          }
        }

        offset += batchSize;
        
        if (districts.length < batchSize) {
          hasMore = false;
        }
      }
    }

    console.log(`Completed! Updated ${updatedCount} records.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated slugs for ${updatedCount} records`,
        updatedCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating slugs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
