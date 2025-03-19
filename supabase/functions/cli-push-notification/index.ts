
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
    console.log(`[CLI-PushNotification] Request received`);
    
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
    
    // Instead of using web-push directly in this function (which causes compatibility issues),
    // we'll forward the request to the send-push-notification function that already works
    
    console.log('[CLI-PushNotification] Forwarding request to send-push-notification endpoint');
    const sendPushEndpoint = `${supabaseUrl}/functions/v1/send-push-notification`;
    
    const response = await fetch(sendPushEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        user_id: targetUserId,
        title: title || 'Sensa.run',
        message: message || 'Tienes una notificación nueva',
        url: url || '/',
      })
    });
    
    const result = await response.json();
    
    console.log('[CLI-PushNotification] Response received from send-push-notification:', result);
    
    // Return combined results
    return new Response(
      JSON.stringify({ 
        success: result.success, 
        results: result.results,
        user_id: targetUserId,
        email: email || 'not provided',
        forwarded: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
    );
  } catch (error) {
    console.error('[CLI-PushNotification] Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
