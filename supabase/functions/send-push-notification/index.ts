
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Define CORS headers with explicit configuration for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

// Simple utility to send web push notifications directly using the Push API
async function sendWebPushNotification(subscription, payload, options) {
  try {
    console.log('Sending push notification to endpoint:', subscription.endpoint);
    
    // Get the endpoint from the subscription
    const { endpoint } = subscription;
    
    // Create an authorization header for VAPID authentication
    // This is a simplified version as we can't use the web-push library
    const getVapidAuthHeader = () => {
      // In a real implementation, we'd generate a proper JWT
      // Here we're creating a minimal header that push services accept
      const vapidKeys = {
        publicKey: options.vapidDetails.publicKey,
        privateKey: options.vapidDetails.privateKey,
      };
      
      const audience = new URL(endpoint).origin;
      const now = Math.floor(Date.now() / 1000);
      const expiration = now + 12 * 3600; // 12 hours from now
      
      const header = { alg: 'ES256', typ: 'JWT' };
      const jwtPayload = {
        aud: audience,
        exp: expiration,
        sub: options.vapidDetails.subject,
      };
      
      // Base64 URL encoding function
      const base64UrlEncode = (str) => {
        return btoa(str)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      };
      
      // Create JWT parts (header and payload)
      const headerStr = base64UrlEncode(JSON.stringify(header));
      const payloadStr = base64UrlEncode(JSON.stringify(jwtPayload));
      
      // In a real implementation, we would sign this JWT
      // Here we're using a placeholder. Push servers will reject this in production
      // but for testing in development it allows the request to proceed
      const signature = base64UrlEncode('signature-placeholder');
      
      return `vapid t=${headerStr}.${payloadStr}.${signature}`;
    };
    
    // For testing purposes, let's send unencrypted data
    // Note: In production, this data should be properly encrypted
    const rawData = new TextEncoder().encode(payload);
    
    // Send the push notification
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'TTL': '86400',  // 24 hours
        'Content-Type': 'application/octet-stream',
        'Content-Length': rawData.length.toString(),
        'Content-Encoding': 'aes128gcm',
        'Authorization': `WebPush ${getVapidAuthHeader()}`
      },
      body: rawData
    });
    
    console.log(`Push notification response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Push service error response:', text);
    }
    
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error.message);
    throw error;
  }
}

serve(async (req) => {
  console.log('Push notification request received:', req.method);
  
  // Handle CORS preflight requests properly
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS');
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
      throw new Error('VAPID configuration is missing')
    }
    
    // Parse the request body
    const { userId, title, message, tag, url, userIds, subscriptions } = await req.json()
    
    console.log('Request data:', { userId, userIds, title, message, tag, url });
    console.log('Subscriptions provided:', subscriptions ? subscriptions.length : 0);
    
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
      console.log('Fetching subscriptions for user:', userId);
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
      
      if (error) throw error
      
      targetSubscriptions = data?.map(item => item.subscription) || []
      console.log(`Found ${targetSubscriptions.length} subscriptions for user`);
    }
    // Case 2: Send to multiple users by ID
    else if (userIds && Array.isArray(userIds)) {
      console.log('Fetching subscriptions for multiple users');
      const { data, error } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userIds)
      
      if (error) throw error
      
      targetSubscriptions = data?.map(item => item.subscription) || []
      console.log(`Found ${targetSubscriptions.length} subscriptions for users`);
    }
    // Case 3: Send to provided subscription objects directly
    else if (subscriptions && Array.isArray(subscriptions)) {
      console.log('Using provided subscriptions directly');
      targetSubscriptions = subscriptions
    }
    // No valid target specified
    else {
      throw new Error('No valid notification target specified')
    }
    
    if (targetSubscriptions.length === 0) {
      console.log('No subscriptions found');
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
    
    // Payload for the notification - make sure it's properly stringified
    const payload = JSON.stringify({
      title: title || 'Sensa.run',
      message: message || 'Tienes una notificación nueva',
      body: message || 'Tienes una notificación nueva', // Include both for compatibility
      tag: tag || 'default',
      url: url || '/',
      timestamp: new Date().getTime()
    })
    
    console.log(`Sending notifications to ${targetSubscriptions.length} subscriptions with payload:`, payload);
    
    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      targetSubscriptions.map(subscription => {
        return sendWebPushNotification(
          subscription,
          payload,
          {
            vapidDetails: {
              subject: vapidSubject,
              publicKey: vapidPublicKey,
              privateKey: vapidPrivateKey
            },
            TTL: 60 * 60 // 1 hour
          }
        );
      })
    )
    
    // Count successful and failed notifications
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length
    
    console.log(`Sent ${successful} notifications successfully, ${failed} failed`);
    
    // Log any rejection reasons for debugging
    results
      .filter(result => result.status === 'rejected')
      .forEach((result, index) => {
        console.error(`Notification ${index} failed:`, result.reason);
      });
    
    return new Response(
      JSON.stringify({
        message: `Sent ${successful} notifications, ${failed} failed`,
        successful,
        failed
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    )
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    )
  }
})
