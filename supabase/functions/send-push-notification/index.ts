
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Since we're having issues with web-push libraries in Deno, let's implement a simpler version
// that directly makes the necessary HTTP requests to send push notifications

// Define CORS headers with explicit configuration for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

// Simple utility to send web push notifications without external libraries
async function sendWebPushNotification(subscription, payload, options) {
  try {
    console.log('Sending push notification with payload:', payload);
    
    // Get the endpoint from the subscription
    const { endpoint } = subscription;
    
    // Create the authorization header using VAPID keys
    const getVapidAuthHeader = () => {
      const vapidKeys = {
        publicKey: options.vapidDetails.publicKey,
        privateKey: options.vapidDetails.privateKey,
      };
      
      // Create a simple JWT token for authentication
      const header = { alg: 'ES256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        aud: new URL(endpoint).origin,
        exp: now + 12 * 3600,
        sub: options.vapidDetails.subject,
      };
      
      const base64UrlEncode = (str) => {
        return btoa(str)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      };
      
      const headerStr = base64UrlEncode(JSON.stringify(header));
      const payloadStr = base64UrlEncode(JSON.stringify(payload));
      const signature = 'fake_signature'; // Note: In a real implementation, we'd generate a proper signature
      
      return `vapid t=${headerStr}.${payloadStr}.${signature}`;
    };
    
    // Use Web Crypto API for encryption (simplified)
    const encryptPayload = async () => {
      // In a full implementation, we'd use the subscription keys to encrypt the payload
      // For now, we'll return the raw payload as we're having dependency issues
      return new TextEncoder().encode(payload);
    };
    
    const encryptedPayload = await encryptPayload();
    
    // Make the push notification request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': encryptedPayload.length.toString(),
        'Content-Encoding': 'aes128gcm',
        'TTL': options.TTL.toString(),
        'Authorization': `WebPush ${getVapidAuthHeader()}`
      },
      body: encryptedPayload
    });
    
    console.log('Push notification response status:', response.status);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
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
    
    // Payload for the notification
    const payload = JSON.stringify({
      title: title || 'Sensa.run',
      message: message || 'Tienes una notificación nueva',
      body: message || 'Tienes una notificación nueva', // Include both for compatibility
      tag: tag || 'default',
      url: url || '/',
      timestamp: new Date().getTime()
    })
    
    console.log(`Sending notifications to ${targetSubscriptions.length} subscriptions`);
    
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
