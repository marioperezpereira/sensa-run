
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

    // Prepare notification payload
    const notificationPayload = {
      title: title || 'Sensa.run',
      body: message || 'Tienes una notificación nueva',
      url: url || '/',
    };

    // For each subscription, trigger the actual browser push notification
    const results = [];

    for (const item of subscriptions) {
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

        // Log subscription details for debugging
        console.log(`[CLI-PushNotification] Processing subscription with endpoint: ${subscription.endpoint}`);
        console.log(`[CLI-PushNotification] Subscription has keys: ${!!subscription.keys}, p256dh: ${!!subscription.keys?.p256dh}, auth: ${!!subscription.keys?.auth}`);
        
        // Validate subscription format before sending
        if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          console.error(`[CLI-PushNotification] Subscription is missing required keys:`, 
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
        
        // Use the send-push-notification function to actually send the push
        console.log(`[CLI-PushNotification] Sending push notification to endpoint via send-push-notification function`);
        
        try {
          const sendResult = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceRoleKey}`
            },
            body: JSON.stringify({
              specific_subscription: subscription,
              title: notificationPayload.title,
              message: notificationPayload.body,
              url: notificationPayload.url
            })
          });

          let responseText;
          try {
            responseText = await sendResult.text();
            console.log(`[CLI-PushNotification] Response status: ${sendResult.status}, Response body:`, responseText);
          } catch (textError) {
            console.error('[CLI-PushNotification] Error reading response text:', textError);
            responseText = 'Could not read response';
          }
          
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            console.error('[CLI-PushNotification] Error parsing JSON response:', e, 'Text was:', responseText);
            responseData = { success: false, error: `Invalid JSON response: ${responseText.slice(0, 100)}...` };
          }

          if (!sendResult.ok) {
            results.push({
              success: false,
              endpoint: subscription.endpoint,
              status: sendResult.status,
              error: responseData.error || `Failed with status: ${sendResult.status}`
            });
          } else {
            if (responseData.success) {
              results.push({
                success: true,
                endpoint: subscription.endpoint,
              });
            } else {
              // Potentially successful HTTP status but application-level failure
              results.push({
                success: false,
                endpoint: subscription.endpoint,
                error: responseData.error || 'Unknown error in notification service'
              });
            }
          }
        } catch (fetchError) {
          console.error('[CLI-PushNotification] Error making request to send-push-notification:', fetchError);
          results.push({
            success: false,
            endpoint: subscription.endpoint,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError)
          });
        }
      } catch (error) {
        console.error(`[CLI-PushNotification] Error processing subscription:`, error);
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          endpoint: item.subscription?.endpoint || 'unknown'
        });
      }
    }

    // Return notification result
    return new Response(
      JSON.stringify({ 
        success: results.some(r => r.success),  // Success if at least one notification was sent
        message: 'Push notification request processed',
        user_id: targetUserId,
        email: email || 'not provided',
        notification: notificationPayload,
        results: results,
        subscriptions_processed: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CLI-PushNotification] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
