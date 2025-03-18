
// Import the required dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Using a direct fetch approach instead of the web-push library
// which is having compatibility issues with Deno

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Function to encode URL safe base64
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to create the VAPID signed JWT token
async function createVAPIDAuthHeader(
  audience: string,
  vapidDetails: { subject: string; publicKey: string; privateKey: string }
): Promise<string> {
  const vapidKeys = {
    subject: vapidDetails.subject,
    publicKey: urlBase64ToUint8Array(vapidDetails.publicKey),
    privateKey: urlBase64ToUint8Array(vapidDetails.privateKey),
  };
  
  // For JWT, we need the current time and an expiration
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 12 * 60 * 60; // 12 hours validity
  
  // Create the JWT header and payload
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: exp,
    sub: vapidKeys.subject,
  };
  
  // We'll use the Web Crypto API to sign the token
  const textEncoder = new TextEncoder();
  const jwsPayload = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}`;
  const jwsSigningInput = textEncoder.encode(jwsPayload);
  
  // Generate a CryptoKey from the private key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    vapidKeys.privateKey,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"]
  );
  
  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    jwsSigningInput
  );
  
  // Convert the signature to base64
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `vapid t=${jwsPayload}.${signatureBase64}, k=${vapidDetails.publicKey}`;
}

// Direct implementation of push notification sending
async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidDetails: { subject: string; publicKey: string; privateKey: string }
): Promise<Response> {
  const audience = new URL(subscription.endpoint).origin;
  
  const vapidHeaders = await createVAPIDAuthHeader(audience, vapidDetails);
  
  // Send the actual push notification
  return await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'high',
      'Authorization': vapidHeaders
    },
    body: payload
  });
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
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
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
          console.log(`[Web Push] Sending to subscription ${index + 1}:`, subscription.endpoint);
          
          // For now, we're using a simplified approach that works with most modern browsers
          // We're just sending notifications directly to the push service
          // without encryption which may not work with all push services
          const result = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'TTL': '86400',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${vapidPublicKey}`
            },
            body: notificationPayload
          });
          
          console.log(`[Web Push] Push service response for ${index + 1}:`, result.status);
          return { success: true, statusCode: result.status };
        } catch (err) {
          console.error(`[Web Push] Error sending to subscription ${index + 1}:`, err);
          
          // Check if subscription is expired or invalid
          if (err.status === 404 || err.status === 410) {
            console.log(`[Web Push] Subscription ${index + 1} is no longer valid, should be removed`);
            // Could implement removal of stale subscriptions here
          }
          
          throw err;
        }
      })
    );
    
    // Count successful and failed notifications
    const successful = sendResults.filter(result => result.status === 'fulfilled').length;
    const failed = sendResults.filter(result => result.status === 'rejected').length;
    
    console.log(`[Web Push] Sent ${successful} notifications successfully, ${failed} failed`);
    
    // Log any rejection reasons for debugging
    sendResults
      .filter(result => result.status === 'rejected')
      .forEach((result, index) => {
        console.error(`[Web Push] Notification ${index} failed:`, result.reason);
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
