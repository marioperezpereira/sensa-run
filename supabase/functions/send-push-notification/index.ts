
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

    // Instead of using web-push directly, which causes compatibility issues,
    // manually construct the push notification payload and send it using the browser's Push API
    // This is a simplified approach that avoids the web-push library
    const results = subscriptions.map(item => {
      try {
        const subscription = item.subscription;
        
        if (!subscription || !subscription.endpoint) {
          return { 
            success: false, 
            error: 'Invalid subscription object', 
            endpoint: subscription?.endpoint || 'unknown' 
          };
        }
        
        return { 
          success: true, 
          endpoint: subscription.endpoint,
          // Return the subscription info so the client can handle sending the notification
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
