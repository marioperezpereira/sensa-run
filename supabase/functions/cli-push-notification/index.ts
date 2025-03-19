
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

    // Get request body - either email or user_id plus notification details
    const { email, user_id, title, message, url } = await req.json();
    
    if (!email && !user_id) {
      throw new Error('Either email or user_id is required');
    }

    console.log(`[CLI-PushNotification] Request received for: ${email || user_id}`);
    
    // Create DB connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase connection details not configured');
    }

    // Initialize the client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // If email is provided, we need to find the user_id
    let targetUserId = user_id;
    
    if (email && !user_id) {
      console.log(`[CLI-PushNotification] Looking up user_id for email: ${email}`);
      
      // Get the user by email
      const { data: userData, error: userError } = await supabase
        .auth
        .admin
        .listUsers();

      if (userError) {
        throw new Error(`Error looking up user: ${userError.message}`);
      }
      
      // Find the user with the matching email
      const user = userData.users.find(u => u.email === email);
      
      if (!user) {
        throw new Error(`No user found with email: ${email}`);
      }
      
      targetUserId = user.id;
      console.log(`[CLI-PushNotification] Found user_id: ${targetUserId} for email: ${email}`);
    }

    // Get user subscriptions from DB
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', targetUserId);

    if (fetchError) {
      throw new Error(`Error fetching subscriptions: ${fetchError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[CLI-PushNotification] No subscriptions found for user: ${targetUserId}`);
      return new Response(
        JSON.stringify({ success: false, error: 'No subscriptions found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`[CLI-PushNotification] Found ${subscriptions.length} subscription(s) for user: ${targetUserId}`);

    try {
      // Set VAPID details
      webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
      );
      
      console.log('[CLI-PushNotification] Successfully set VAPID details');
    } catch (error) {
      console.error('[CLI-PushNotification] Error setting VAPID details:', error);
      throw new Error(`Error setting VAPID details: ${error.message}`);
    }

    // Send notification to each subscription
    const results = await Promise.all(
      subscriptions.map(async (item) => {
        try {
          const subscription = item.subscription;
          
          // Validate subscription object
          if (!subscription || !subscription.endpoint) {
            console.error('[CLI-PushNotification] Invalid subscription object:', subscription);
            return { success: false, error: 'Invalid subscription object' };
          }
          
          const payload = JSON.stringify({
            title: title || 'Sensa.run',
            body: message || 'Tienes una notificación nueva',
            url: url || '/',
          });
          
          console.log(`[CLI-PushNotification] Sending to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          await webpush.sendNotification(subscription, payload);
          console.log(`[CLI-PushNotification] Successfully sent notification to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error(`[CLI-PushNotification] Error sending notification:`, error);
          return { success: false, error: error.message, endpoint: item.subscription?.endpoint };
        }
      })
    );

    // Return results
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        user_id: targetUserId,
        email: email || 'not provided'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CLI-PushNotification] Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
