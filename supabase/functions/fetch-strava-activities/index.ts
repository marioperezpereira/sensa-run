
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0?dts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    console.log('Processing user_id:', user_id)

    if (!user_id) {
      throw new Error('No user_id provided')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the stored refresh token for this user
    const { data: tokenData, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('refresh_token')
      .eq('user_id', user_id)
      .single()

    if (tokenError || !tokenData?.refresh_token) {
      throw new Error('No refresh token found for user')
    }

    // Get athlete's access token from Strava
    const tokenResponse = await fetch(
      `https://www.strava.com/api/v3/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token
        })
      }
    )

    const refreshData = await tokenResponse.json()
    console.log('Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      console.error('Token error response:', refreshData)
      throw new Error(`Failed to get access token: ${JSON.stringify(refreshData)}`)
    }

    // Update stored refresh token if a new one was provided
    if (refreshData.refresh_token && refreshData.refresh_token !== tokenData.refresh_token) {
      await supabase
        .from('strava_tokens')
        .update({ refresh_token: refreshData.refresh_token })
        .eq('user_id', user_id)
    }

    // Fetch activities with the new access token
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=20`,
      {
        headers: {
          'Authorization': `Bearer ${refreshData.access_token}`
        }
      }
    )

    if (!activitiesResponse.ok) {
      throw new Error(`Failed to fetch activities: ${activitiesResponse.status}`)
    }

    const activities = await activitiesResponse.json()
    console.log(`Successfully fetched ${activities.length} activities`)
    
    // Only fetch laps for the latest 5 activities to avoid API rate limits
    const activitiesForLaps = activities.slice(0, 5);
    
    // For each of the latest 5 activities, fetch its laps
    for (const activity of activitiesForLaps) {
      try {
        const lapsResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${activity.id}/laps`,
          {
            headers: {
              'Authorization': `Bearer ${refreshData.access_token}`
            }
          }
        )
        
        if (lapsResponse.ok) {
          const laps = await lapsResponse.json()
          // Add laps to the activity object
          activity.laps = laps
          console.log(`Fetched ${laps.length} laps for activity ${activity.id}`)
        } else {
          console.error(`Failed to fetch laps for activity ${activity.id}: ${lapsResponse.status}`)
          activity.laps = []
        }
      } catch (error) {
        console.error(`Error fetching laps for activity ${activity.id}:`, error)
        activity.laps = []
      }
    }
    
    // Make sure all activities have a laps property, even if it's empty
    for (let i = 5; i < activities.length; i++) {
      activities[i].laps = [];
    }

    return new Response(JSON.stringify({ activities }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
