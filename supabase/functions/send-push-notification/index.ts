import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Define CORS headers with explicit configuration for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  console.log('[Edge Function] Push notification request received:', req.method);
  
  // Handle CORS preflight requests properly
  if (req.method === 'OPTIONS') {
    console.log('[Edge Function] Handling OPTIONS request for CORS');
    return new Response(null, { 
      status: 204, // Use 204 No Content for OPTIONS
      headers: corsHeaders 
    });
  }

  try {
    // Get VAPID keys from environment variables
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')
    
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('[Edge Function] VAPID configuration is missing')
    }
    
    // Parse the request body
    const requestData = await req.json();
    const { userId, title, message, tag, url, userIds, subscriptions } = requestData;
    
    console.log('[Edge Function] Request data:', { userId, userIds, title, message, tag, url });
    console.log('[Edge Function] Subscriptions provided:', subscriptions ? subscriptions.length : 0);
    
    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('[Edge Function] Supabase configuration is missing')
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    
    let targetSubscriptions = []
    
    // Case 1: Send to a specific user by ID
    if (userId) {
      console.log('[Edge Function] Fetching subscriptions for user:', userId);
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
      
      if (error) throw error
      
      targetSubscriptions = data?.map(item => item.subscription) || []
      console.log(`[Edge Function] Found ${targetSubscriptions.length} subscriptions for user`);
    }
    // Case 2: Send to multiple users by ID
    else if (userIds && Array.isArray(userIds)) {
      console.log('[Edge Function] Fetching subscriptions for multiple users');
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userIds)
      
      if (error) throw error
      
      targetSubscriptions = data?.map(item => item.subscription) || []
      console.log(`[Edge Function] Found ${targetSubscriptions.length} subscriptions for users`);
    }
    // Case 3: Send to provided subscription objects directly
    else if (subscriptions && Array.isArray(subscriptions)) {
      console.log('[Edge Function] Using provided subscriptions directly');
      targetSubscriptions = subscriptions
    }
    // No valid target specified
    else {
      throw new Error('[Edge Function] No valid notification target specified')
    }
    
    if (targetSubscriptions.length === 0) {
      console.log('[Edge Function] No subscriptions found');
      return new Response(
        JSON.stringify({
          message: 'No subscriptions found for the specified target(s)'
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
      )
    }
    
    // Create the notification payload - keep it very simple for maximum compatibility
    const payload = JSON.stringify({
      title: title || 'Sensa.run',
      message: message || 'Tienes una notificación nueva',
      tag: tag || `sensa-${Date.now()}`,
      url: url || '/',
      timestamp: Date.now()
    });
    
    console.log(`[Edge Function] Sending notifications to ${targetSubscriptions.length} subscriptions with payload:`, payload);
    
    // Send push notifications to all subscriptions - simple approach without web-push library
    const results = await Promise.allSettled(
      targetSubscriptions.map(async (subscription, index) => {
        try {
          console.log(`[Edge Function] Sending to subscription ${index + 1}:`, subscription.endpoint);
          
          // Keep the call as simple as possible
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400'
            },
            body: payload
          });
          
          console.log(`[Edge Function] Push service response for ${index + 1}:`, response.status);
          return response;
        } catch (err) {
          console.error(`[Edge Function] Error sending to subscription ${index + 1}:`, err);
          throw err;
        }
      })
    );
    
    // Count successful and failed notifications
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`[Edge Function] Sent ${successful} notifications successfully, ${failed} failed`);
    
    // Log any rejection reasons for debugging
    results
      .filter(result => result.status === 'rejected')
      .forEach((result, index) => {
        console.error(`[Edge Function] Notification ${index} failed:`, result.reason);
      });
    
    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications, ${failed} failed`,
        successful,
        failed,
        debug: {
          subscriptionCount: targetSubscriptions.length,
          payloadSize: payload.length,
        }
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    );
    
  } catch (error) {
    console.error('[Edge Function] Error sending push notification:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
