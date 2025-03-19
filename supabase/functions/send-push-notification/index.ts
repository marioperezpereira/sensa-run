
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
// Import web-push with a specific version that's compatible with Deno
import webpush from 'https://esm.sh/web-push@3.5.0'

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
    // Get the VAPID keys from environment variables
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY'); 
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID keys not configured');
    }

    // Get request body
    const { user_id, title, message, url } = await req.json();
    
    if (!user_id) {
      throw new Error('User ID is required');
    }

    console.log(`[PushNotification] Sending notification to user: ${user_id}`);
    
    // Create DB connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase connection details not configured');
    }

    // Initialize the client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get user subscriptions from DB
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

    try {
      // Set VAPID details
      webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
      );
      
      console.log('[PushNotification] Successfully set VAPID details');
    } catch (error) {
      console.error('[PushNotification] Error setting VAPID details:', error);
      throw new Error(`Error setting VAPID details: ${error.message}`);
    }

    // Send notification to each subscription
    const results = await Promise.all(
      subscriptions.map(async (item) => {
        try {
          const subscription = item.subscription;
          
          // Validate subscription object
          if (!subscription || !subscription.endpoint) {
            console.error('[PushNotification] Invalid subscription object:', subscription);
            return { success: false, error: 'Invalid subscription object' };
          }
          
          const payload = JSON.stringify({
            title: title || 'Sensa.run',
            body: message || 'Tienes una notificación nueva',
            url: url || '/',
          });
          
          console.log(`[PushNotification] Sending to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          await webpush.sendNotification(subscription, payload);
          console.log(`[PushNotification] Successfully sent notification to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error(`[PushNotification] Error sending notification:`, error);
          return { success: false, error: error.message, endpoint: item.subscription?.endpoint };
        }
      })
    );

    // Return results
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PushNotification] Error in send-push-notification function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
