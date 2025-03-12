
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import FirecrawlApp from 'npm:@mendable/firecrawl-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { strava_url } = await req.json()
    console.log('Scraping Strava URL:', strava_url)

    if (!strava_url) {
      throw new Error('No Strava URL provided')
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!apiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    console.log('Initializing Firecrawl with API key')
    const firecrawl = new FirecrawlApp({ apiKey })

    console.log('Starting Firecrawl request with URL:', strava_url)
    
    try {
      // Using the simplest possible configuration for the API
      const response = await firecrawl.crawlUrl(strava_url, {
        limit: 1
      })

      console.log('Raw Firecrawl response:', JSON.stringify(response, null, 2))

      if (!response) {
        throw new Error('Empty response from Firecrawl')
      }

      // Get HTML content and parse it manually
      const activities = response.data?.map((item: any) => ({
        name: item.name || 'Untitled Activity',
        type: item.type || 'Unknown Type',
        date: item.date || new Date().toISOString()
      })) || [];

      return new Response(JSON.stringify({
        success: true,
        data: { activities }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })

    } catch (crawlError) {
      console.error('Error during Firecrawl request:', {
        message: crawlError.message,
        name: crawlError.name,
        stack: crawlError.stack
      })
      throw new Error(`Firecrawl request failed: ${crawlError.message}`)
    }

  } catch (error) {
    console.error('Error in edge function:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Failed to scrape Strava activities: ${error.message}`,
        details: error.stack,
        name: error.name,
        cause: error.cause
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
