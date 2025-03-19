
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    // Initialize the client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    let subscriptionsToProcess = [];
    
    // If a specific subscription was provided, use that
    if (specific_subscription) {
      console.log(`[PushNotification] Using provided specific subscription`);
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
    const results = subscriptionsToProcess.map(item => {
      try {
        const subscription = item.subscription;
        
        if (!subscription || !subscription.endpoint) {
          return { 
            success: false, 
            error: 'Invalid subscription object', 
            endpoint: subscription?.endpoint || 'unknown' 
          };
        }
        
        console.log(`[PushNotification] Processing subscription: ${subscription.endpoint}`);
        
        // Here we're returning the subscription and payload so the client can use the 
        // browser Push API to send the notification
        return { 
          success: true, 
          endpoint: subscription.endpoint,
          subscription: subscription,
          payload: {
            title: title || 'Sensa.run',
            body: message || 'Tienes una notificación nueva',
            url: url || '/',
          }
        };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          endpoint: item.subscription?.endpoint || 'unknown'
        };
      }
    });

    // Let's try to directly send push notification using the web push API
    // This is an attempt to send the notification directly from the edge function
    // without relying on the client to do it
    for (const result of results) {
      if (result.success && result.subscription) {
        try {
          // Create a simple text payload
          const payload = JSON.stringify(result.payload);
          
          console.log(`[PushNotification] Sending notification to endpoint: ${result.endpoint}`);
          
          // Make a direct POST request to the push service
          const pushServiceResponse = await fetch(result.subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '60',
              // The subscription object should contain the auth and p256dh keys needed
              // but we're not using them directly - browser handles the encryption
            },
            body: payload
          });
          
          if (!pushServiceResponse.ok) {
            console.error(`[PushNotification] Push service error: ${pushServiceResponse.status} ${pushServiceResponse.statusText}`);
            result.directPushError = `Push service error: ${pushServiceResponse.status}`;
          } else {
            console.log(`[PushNotification] Successfully sent notification directly to endpoint: ${result.endpoint}`);
            result.directPushSuccess = true;
          }
        } catch (error) {
          console.error(`[PushNotification] Error sending direct push:`, error);
          result.directPushError = error instanceof Error ? error.message : String(error);
        }
      }
    }

    // Return the subscription info to the client
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: 'Notification data prepared for delivery'
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
