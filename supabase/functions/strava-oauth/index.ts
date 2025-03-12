
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id } = await req.json()
    console.log('Initializing Strava OAuth for user:', user_id)

    if (!user_id) {
      throw new Error('No user ID provided')
    }

    const clientId = Deno.env.get('STRAVA_CLIENT_ID')
    if (!clientId) {
      throw new Error('Strava client ID not configured')
    }

    // Create the authorization URL with the correct redirect URI format
    const redirectUri = `${req.headers.get('origin')}/strava/callback`
    const scope = 'activity:read_all'
    
    const authUrl = `https://www.strava.com/oauth/authorize?` + 
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `state=${user_id}` // Pass the user_id as state for security

    return new Response(
      JSON.stringify({ url: authUrl }),
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
