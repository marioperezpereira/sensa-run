
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
// Use a specific version of web-push that's known to work with Deno
import webPush from 'https://esm.sh/web-push@3.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { user_id, title, message, url, specific_subscription } = await req.json();
    
    if (!user_id && !specific_subscription) {
      throw new Error('Either user_id or specific_subscription is required');
    }

    console.log(`[PushNotification] Processing request for user: ${user_id || 'specific subscription'}`);
    
    // Create DB connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase connection details not configured');
    }

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID configuration missing');
    }

    console.log(`[PushNotification] VAPID details - Subject: ${vapidSubject}, Public key exists: ${!!vapidPublicKey}, Private key exists: ${!!vapidPrivateKey}`);

    // Initialize the client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    let subscriptionsToProcess = [];
    
    // If a specific subscription was provided, use that
    if (specific_subscription) {
      console.log(`[PushNotification] Using provided specific subscription`);
      console.log(`[PushNotification] Subscription endpoint: ${specific_subscription.endpoint}`);
      subscriptionsToProcess = [{ subscription: specific_subscription }];
    } else {
      // Get user subscriptions from DB
      console.log(`[PushNotification] Fetching subscriptions for user: ${user_id}`);
      const { data: subscriptions, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', user_id);

      if (fetchError) {
        throw new Error(`Error fetching subscriptions: ${fetchError.message}`);
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[PushNotification] No subscriptions found for user: ${user_id}`);
        return new Response(
          JSON.stringify({ success: false, error: 'No subscriptions found for user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      console.log(`[PushNotification] Found ${subscriptions.length} subscription(s) for user: ${user_id}`);
      subscriptionsToProcess = subscriptions;
    }

    // Process each subscription
    const results = [];
    
    try {
      // Setup web-push with VAPID details - Do this only once outside the loop
      console.log(`[PushNotification] Setting up VAPID with subject: ${vapidSubject}`);
      webPush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
      );
      console.log(`[PushNotification] Successfully set VAPID details`);
    } catch (vapidError) {
      console.error(`[PushNotification] Error setting VAPID details:`, vapidError);
      throw new Error(`Failed to set VAPID keys: ${vapidError.message}`);
    }

    for (const item of subscriptionsToProcess) {
      try {
        const subscription = item.subscription;
        
        if (!subscription || !subscription.endpoint) {
          results.push({ 
            success: false, 
            error: 'Invalid subscription object', 
            endpoint: subscription?.endpoint || 'unknown' 
          });
          continue;
        }
        
        console.log(`[PushNotification] Processing subscription: ${subscription.endpoint}`);
        
        // Validate subscription format
        if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          console.error(`[PushNotification] Subscription is missing required keys:`, 
            JSON.stringify({
              hasKeys: !!subscription.keys,
              hasP256dh: subscription.keys?.p256dh,
              hasAuth: subscription.keys?.auth
            }));
          
          results.push({ 
            success: false, 
            error: 'Subscription is missing required keys', 
            endpoint: subscription.endpoint 
          });
          continue;
        }
        
        console.log(`[PushNotification] Subscription keys present: p256dh=${!!subscription.keys?.p256dh}, auth=${!!subscription.keys?.auth}`);
        
        // Create payload
        const payload = JSON.stringify({
          title: title || 'Sensa.run',
          body: message || 'Tienes una notificación nueva',
          url: url || '/',
        });
        
        console.log(`[PushNotification] Sending notification to endpoint: ${subscription.endpoint}`);
        
        try {
          // Send the notification using web-push
          await webPush.sendNotification(subscription, payload);
          console.log(`[PushNotification] Successfully sent notification to endpoint: ${subscription.endpoint}`);
          
          results.push({ 
            success: true, 
            endpoint: subscription.endpoint,
          });
        } catch (pushError) {
          console.error(`[PushNotification] Push service error:`, pushError);
          
          // Check for common errors
          let errorMessage = pushError.message || 'Unknown push error';
          let statusCode = pushError.statusCode || 500;
          
          if (statusCode === 401) {
            errorMessage = `Authentication error (401): VAPID key mismatch or invalid token`;
          } else if (statusCode === 404) {
            errorMessage = `Subscription not found (404): Browser may have unsubscribed`;
          } else if (statusCode === 410) {
            errorMessage = `Subscription expired (410): Should be removed from database`;
          }
          
          results.push({ 
            success: false, 
            error: errorMessage,
            status: statusCode,
            endpoint: subscription.endpoint
          });
        }
      } catch (error) {
        console.error(`[PushNotification] Error processing subscription:`, error);
        
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          endpoint: item.subscription?.endpoint || 'unknown'
        });
      }
    }

    // Return the results to the client
    return new Response(
      JSON.stringify({ 
        success: results.some(r => r.success), 
        message: 'Notification processing completed',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PushNotification] Error in send-push-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
