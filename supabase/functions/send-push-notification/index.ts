
// Import the required dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Main handler function
serve(async (req) => {
  console.log('[Web Push] Request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Web Push] Handling OPTIONS request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Get VAPID keys from environment variables
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    
    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('[Web Push] VAPID configuration is missing');
    }

    // Parse the request body
    const requestData = await req.json();
    const { userId, title, message, url, tag, userIds, subscriptions } = requestData;
    
    console.log('[Web Push] Request data:', { 
      userId, 
      userIds: userIds ? `Array with ${userIds?.length} items` : undefined, 
      title, 
      message, 
      tag, 
      url,
      subscriptionsProvided: subscriptions ? subscriptions.length : 0
    });
    
    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('[Web Push] Supabase configuration is missing');
    }
    
    // Create Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    let targetSubscriptions = [];
    
    // Case 1: Send to a specific user by ID
    if (userId) {
      console.log('[Web Push] Fetching subscriptions for user:', userId);
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId);
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      targetSubscriptions = data?.map(item => item.subscription) || [];
      console.log(`[Web Push] Found ${targetSubscriptions.length} subscriptions for user`);
    }
    // Case 2: Send to multiple users by ID
    else if (userIds && Array.isArray(userIds)) {
      console.log('[Web Push] Fetching subscriptions for multiple users');
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userIds);
      
      if (error) throw new Error(`Database error: ${error.message}`);
      
      targetSubscriptions = data?.map(item => item.subscription) || [];
      console.log(`[Web Push] Found ${targetSubscriptions.length} subscriptions for users`);
    }
    // Case 3: Send to provided subscription objects directly
    else if (subscriptions && Array.isArray(subscriptions)) {
      console.log('[Web Push] Using provided subscriptions directly');
      targetSubscriptions = subscriptions;
    }
    // No valid target specified
    else {
      throw new Error('[Web Push] No valid notification target specified');
    }
    
    if (targetSubscriptions.length === 0) {
      console.log('[Web Push] No subscriptions found');
      return new Response(
        JSON.stringify({
          message: 'No subscriptions found for the specified target(s)'
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }
    
    // Create the notification payload
    const notificationPayload = JSON.stringify({
      title: title || 'Sensa.run',
      body: message || 'Tienes una notificación nueva',
      tag: tag || `sensa-${Date.now()}`,
      url: url || '/',
      timestamp: Date.now(),
      icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
      badge: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true
    });
    
    console.log(`[Web Push] Sending notifications to ${targetSubscriptions.length} subscriptions with payload:`, notificationPayload);
    
    // Send push notifications to all subscriptions
    const sendResults = await Promise.allSettled(
      targetSubscriptions.map(async (subscription, index) => {
        try {
          const endpoint = subscription.endpoint.trim(); // Remove any trailing whitespace including \n
          console.log(`[Web Push] Sending to subscription ${index + 1}:`, endpoint);
          
          // Check if this is a Google FCM endpoint
          const isFCM = endpoint.includes('fcm.googleapis.com');
          
          let result;
          
          if (isFCM) {
            // Special handling for FCM endpoints
            // For FCM, we need a different authorization approach
            // FCM requires a server key instead of VAPID for older implementations
            result = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${vapidPublicKey}`, // Use the vapidPublicKey as the FCM auth key
                'TTL': '86400'
              },
              body: JSON.stringify({
                notification: {
                  title: title || 'Sensa.run',
                  body: message || 'Tienes una notificación nueva',
                  icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
                  click_action: url || '/'
                }
              })
            });
          } else {
            // For other push services (like Firefox, Safari, etc.)
            result = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'TTL': '86400',
                'Content-Type': 'application/json',
                'Content-Length': notificationPayload.length.toString(),
                'Authorization': `Bearer ${vapidPublicKey}`
              },
              body: notificationPayload
            });
          }
          
          console.log(`[Web Push] Push service response for ${index + 1}:`, result.status);
          if (result.status >= 400) {
            const responseText = await result.text();
            console.error(`[Web Push] Error response from push service ${index + 1}:`, responseText);
          }
          
          return { success: result.status < 400, statusCode: result.status };
        } catch (err) {
          console.error(`[Web Push] Error sending to subscription ${index + 1}:`, err);
          
          // Check if subscription is expired or invalid
          if (err.status === 404 || err.status === 410) {
            console.log(`[Web Push] Subscription ${index + 1} is no longer valid, should be removed`);
          }
          
          throw err;
        }
      })
    );
    
    // Count successful and failed notifications
    const successful = sendResults.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = sendResults.length - successful;
    
    console.log(`[Web Push] Sent ${successful} notifications successfully, ${failed} failed`);
    
    // Log any rejection reasons for debugging
    sendResults
      .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
      .forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Web Push] Notification ${index} failed with error:`, result.reason);
        } else {
          console.error(`[Web Push] Notification ${index} failed with status code:`, result.value.statusCode);
        }
      });
    
    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications, ${failed} failed`,
        successful,
        failed,
        debug: {
          subscriptionCount: targetSubscriptions.length,
          payloadSize: notificationPayload.length
        }
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    );
    
  } catch (error) {
    console.error('[Web Push] Error sending push notification:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error'
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
