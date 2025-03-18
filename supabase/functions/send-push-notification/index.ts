
// Import the required dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as base64 from "https://deno.land/std@0.167.0/encoding/base64.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Helper function to encode base64url 
function base64UrlEncode(arrayBuffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate the VAPID authentication header for Web Push
async function generateVAPIDAuthHeader(
  audience: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  subject: string,
  expiration: number = 12 * 60 * 60
): Promise<string> {
  try {
    // Create the JWT header and payload
    const header = {
      typ: "JWT",
      alg: "ES256"
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: audience,
      exp: now + expiration,
      sub: subject
    };

    // Base64 encode the header and payload
    const encodeHeader = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(header))
    );
    const encodePayload = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(payload))
    );
    
    const signatureBase = `${encodeHeader}.${encodePayload}`;
    
    // Convert the VAPID private key from base64 to raw private key for signing
    const keyData = base64.decode(vapidPrivateKey);
    
    // Import the private key for signing
    const key = await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"]
    );
    
    // Sign the data
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      key,
      new TextEncoder().encode(signatureBase)
    );
    
    // Combine all parts to create the JWT token
    const jwt = `${signatureBase}.${base64UrlEncode(signature)}`;
    
    // Return the full Authorization header
    return `vapid t=${jwt}, k=${vapidPublicKey}`;
  } catch (error) {
    console.error("[Web Push] Error generating VAPID auth header:", error);
    throw error;
  }
}

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
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim();
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim();
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')?.trim();
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')?.trim();
    
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    
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
          // Make sure to trim any whitespace including newlines from endpoint
          const endpoint = subscription.endpoint.trim();
          console.log(`[Web Push] Processing subscription ${index + 1}:`, endpoint);
          
          // Check if this is a Google FCM endpoint
          const isFCM = endpoint.includes('fcm.googleapis.com');
          
          // Extract the origin for the audience in the JWT
          const audienceURL = new URL(endpoint);
          const audience = `${audienceURL.protocol}//${audienceURL.host}`;
          
          let result;
          
          if (isFCM) {
            // FCM needs a special format
            console.log(`[Web Push] Subscription ${index + 1} is FCM, using FCM format`);
            
            if (!fcmServerKey) {
              throw new Error('[Web Push] FCM_SERVER_KEY is required for FCM endpoints');
            }
            
            // Extract the FCM token from the endpoint URL
            // FCM endpoint format: https://fcm.googleapis.com/fcm/send/DEVICE_TOKEN
            const fcmToken = endpoint.split('/').pop();
            
            if (!fcmToken) {
              throw new Error('[Web Push] Invalid FCM endpoint format');
            }
            
            // Send to FCM endpoint with the FCM-specific format
            result = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${fcmServerKey}`,
              },
              body: JSON.stringify({
                to: fcmToken,
                notification: {
                  title: title || 'Sensa.run',
                  body: message || 'Tienes una notificación nueva',
                  icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
                  click_action: url || '/'
                },
                data: {
                  url: url || '/'
                }
              })
            });
          } else {
            // Standard Web Push
            console.log(`[Web Push] Subscription ${index + 1} is standard Web Push`);
            
            // Generate VAPID Authorization header
            const authHeader = await generateVAPIDAuthHeader(
              audience,
              vapidPrivateKey,
              vapidPublicKey,
              vapidSubject
            );
            
            // Add encryption headers based on the subscription
            const encHeaders = {
              'TTL': '86400',
              'Content-Type': 'application/json',
              'Content-Encoding': 'aes128gcm',
              'Authorization': authHeader
            };
            
            // Send to standard web push endpoint
            result = await fetch(endpoint, {
              method: 'POST',
              headers: encHeaders,
              body: notificationPayload
            });
          }
          
          console.log(`[Web Push] Push service response for ${index + 1}:`, result.status);
          
          if (result.status >= 400) {
            const responseText = await result.text();
            console.error(`[Web Push] Error response from push service ${index + 1}:`, responseText);
            return { success: false, statusCode: result.status, response: responseText };
          }
          
          return { success: result.status < 400, statusCode: result.status };
        } catch (err) {
          console.error(`[Web Push] Error sending to subscription ${index + 1}:`, err);
          
          // Check if subscription is expired or invalid
          if (err.status === 404 || err.status === 410) {
            console.log(`[Web Push] Subscription ${index + 1} is no longer valid, should be removed`);
          }
          
          return { success: false, error: err.message };
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
          if (result.value.response) {
            console.error(`[Web Push] Error response:`, result.value.response);
          }
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
