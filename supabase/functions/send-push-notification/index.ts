
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import webPush from 'https://esm.sh/web-push@3.6.4'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    })
  }

  try {
    // Get VAPID keys from environment variables
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')
    
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID configuration is missing')
    }
    
    // Set up web-push with our VAPID keys
    webPush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    )
    
    // Parse the request body
    const { userId, title, message, tag, url, userIds, subscriptions } = await req.json()
    
    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing')
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    
    let targetSubscriptions = []
    
    // Case 1: Send to a specific user by ID
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
      
      if (error) throw error
      
      targetSubscriptions = data?.map(item => item.subscription) || []
    }
    // Case 2: Send to multiple users by ID
    else if (userIds && Array.isArray(userIds)) {
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userIds)
      
      if (error) throw error
      
      targetSubscriptions = data?.map(item => item.subscription) || []
    }
    // Case 3: Send to provided subscription objects directly
    else if (subscriptions && Array.isArray(subscriptions)) {
      targetSubscriptions = subscriptions
    }
    // No valid target specified
    else {
      throw new Error('No valid notification target specified')
    }
    
    if (targetSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No subscriptions found for the specified target(s)'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Payload for the notification
    const payload = JSON.stringify({
      title: title || 'Sensa.run',
      message: message || 'Tienes una notificación nueva',
      body: message || 'Tienes una notificación nueva', // Include both for compatibility
      tag: tag || 'default',
      url: url || '/',
      timestamp: new Date().getTime()
    })
    
    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      targetSubscriptions.map(subscription => 
        webPush.sendNotification(subscription, payload)
      )
    )
    
    // Count successful and failed notifications
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length
    
    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications, ${failed} failed`,
        successful,
        failed
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('Error sending push notification:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
