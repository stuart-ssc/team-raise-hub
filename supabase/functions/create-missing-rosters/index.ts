import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          group_name: string
          school_id: string
          status: boolean
        }
      }
      Rosters: {
        Row: {
          id: number
          group_id: string
          roster_year: number
          current_roster: boolean
          created_at: string
        }
        Insert: {
          group_id: string
          roster_year: number
          current_roster: boolean
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting to create missing rosters...')

    // Get current year
    const currentYear = new Date().getFullYear()

    // Find groups that don't have rosters
    const { data: groupsWithoutRosters, error: queryError } = await supabase
      .from('groups')
      .select('id, group_name, school_id, status')
      .is('id', 'not.in.(select group_id from "Rosters" where group_id is not null)')

    if (queryError) {
      console.error('Error querying groups:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to query groups' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${groupsWithoutRosters?.length || 0} groups without rosters`)

    if (!groupsWithoutRosters || groupsWithoutRosters.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No groups without rosters found',
          created: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create roster records for groups without them
    const rostersToCreate = groupsWithoutRosters.map(group => ({
      group_id: group.id,
      roster_year: currentYear,
      current_roster: true
    }))

    const { data: createdRosters, error: insertError } = await supabase
      .from('Rosters')
      .insert(rostersToCreate)
      .select()

    if (insertError) {
      console.error('Error creating rosters:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create rosters' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully created ${createdRosters?.length || 0} rosters`)

    return new Response(
      JSON.stringify({ 
        message: 'Rosters created successfully',
        created: createdRosters?.length || 0,
        rosters: createdRosters
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})