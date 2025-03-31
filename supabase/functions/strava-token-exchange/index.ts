
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    console.log('Processing code:', code)
    
    if (!code) {
      throw new Error('No authorization code provided')
    }

    const clientId = Deno.env.get('STRAVA_CLIENT_ID')
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseServiceKey
      })
      throw new Error('Missing required environment variables')
    }

    console.log('Making token request to Strava...')
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()
    console.log('Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      console.error('Strava token error:', tokenData)
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`)
    }
    
    if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.athlete?.id) {
      console.error('Invalid token data:', tokenData)
      throw new Error('Failed to get required token data')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store refresh token in our database
    await supabase
      .from('strava_tokens')
      .upsert({
        user_id: req.headers.get('x-user-id'),
        athlete_id: tokenData.athlete.id.toString(),
        refresh_token: tokenData.refresh_token
      }, {
        onConflict: 'user_id'
      })

    console.log('Fetching Strava activities...')
    const activitiesResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=20',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    )

    const activities = await activitiesResponse.json()
    console.log(`Fetched ${activities.length} activities`)

    for (const activity of activities) {
      await supabase
        .from('strava_activities')
        .upsert({
          user_id: req.headers.get('x-user-id'),
          strava_id: activity.id,
          name: activity.name,
          type: activity.type,
          start_date: activity.start_date,
          distance: activity.distance,
          moving_time: activity.moving_time || 0
        }, {
          onConflict: 'strava_id'
        })
    }

    return new Response(
      JSON.stringify({ 
        athlete_id: tokenData.athlete.id 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
