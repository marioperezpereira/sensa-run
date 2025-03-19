
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { base64ToUint8Array, uint8ArrayToBase64Url } from './utils.ts'

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

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID configuration missing');
    }

    console.log(`[PushNotification] VAPID details - Subject: ${vapidSubject}, Public key exists: ${!!vapidPublicKey}, Private key exists: ${!!vapidPrivateKey}`);

    // Initialize the client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    let subscriptionsToProcess = [];
    
    // If a specific subscription was provided, use that
    if (specific_subscription) {
      console.log(`[PushNotification] Using provided specific subscription`);
      console.log(`[PushNotification] Subscription endpoint: ${specific_subscription.endpoint}`);
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
    const results = [];

    for (const item of subscriptionsToProcess) {
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
        
        console.log(`[PushNotification] Processing subscription: ${subscription.endpoint}`);
        
        // Validate subscription format
        if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          console.error(`[PushNotification] Subscription is missing required keys:`, 
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
        
        console.log(`[PushNotification] Subscription keys present: p256dh=${!!subscription.keys?.p256dh}, auth=${!!subscription.keys?.auth}`);
        
        // Create payload
        const payload = JSON.stringify({
          title: title || 'Sensa.run',
          body: message || 'Tienes una notificación nueva',
          url: url || '/',
        });
        
        console.log(`[PushNotification] Sending notification to endpoint: ${subscription.endpoint}`);
        
        try {
          // Send the notification with our custom implementation
          const result = await sendPushNotification(
            subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );
          
          if (result.ok) {
            console.log(`[PushNotification] Successfully sent notification to endpoint: ${subscription.endpoint}`);
            results.push({ 
              success: true, 
              endpoint: subscription.endpoint,
            });
          } else {
            const statusCode = result.status;
            let errorText = await result.text().catch(() => "Could not read error response");
            
            console.error(`[PushNotification] Push service error: Status ${statusCode}, Response: ${errorText}`);
            
            // Check for common errors
            let errorMessage = `HTTP Error ${statusCode}: ${errorText}`;
            
            if (statusCode === 401) {
              errorMessage = `Authentication error (401): VAPID key mismatch or invalid token`;
            } else if (statusCode === 404) {
              errorMessage = `Subscription not found (404): Browser may have unsubscribed`;
            } else if (statusCode === 410) {
              errorMessage = `Subscription expired (410): Should be removed from database`;
            }
            
            results.push({ 
              success: false, 
              error: errorMessage,
              status: statusCode,
              endpoint: subscription.endpoint
            });
          }
        } catch (pushError) {
          console.error(`[PushNotification] Error sending push:`, pushError);
          
          results.push({ 
            success: false, 
            error: pushError instanceof Error ? pushError.message : String(pushError),
            endpoint: subscription.endpoint
          });
        }
      } catch (error) {
        console.error(`[PushNotification] Error processing subscription:`, error);
        
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          endpoint: item.subscription?.endpoint || 'unknown'
        });
      }
    }

    // Return the results to the client
    return new Response(
      JSON.stringify({ 
        success: results.some(r => r.success), 
        message: 'Notification processing completed',
        results 
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

// Custom implementation of web push notification without using the web-push library
async function sendPushNotification(
  subscription: any,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  try {
    // Parse the endpoint URL
    const endpoint = subscription.endpoint;
    const url = new URL(endpoint);
    
    // Get the audience (origin) from the endpoint
    const audience = `${url.protocol}//${url.host}`;
    
    // Create the headers
    const headers = new Headers();
    headers.append('Content-Type', 'application/octet-stream');
    headers.append('TTL', '86400');  // 24 hours in seconds
    
    // Create the JWT token for Authorization
    const token = await createVapidAuthorizationToken(
      audience,
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    headers.append('Authorization', `vapid t=${token}`);
    
    // Encrypt the payload
    const encryptedPayload = await encryptPayload(
      subscription.keys.p256dh,
      subscription.keys.auth,
      payload
    );
    
    if (!encryptedPayload) {
      throw new Error('Failed to encrypt the payload');
    }
    
    // Set the encrypted content encryption header
    if (encryptedPayload.contentEncoding) {
      headers.append('Content-Encoding', encryptedPayload.contentEncoding);
    }
    
    // Send the push message
    return await fetch(endpoint, {
      method: 'POST',
      headers,
      body: encryptedPayload.cipherText
    });
  } catch (error) {
    console.error('[PushNotification] Error in sendPushNotification:', error);
    throw error;
  }
}

// Create a VAPID JWT token for Authorization
async function createVapidAuthorizationToken(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  try {
    // Create JWT header
    const header = {
      typ: 'JWT',
      alg: 'ES256'
    };
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Create JWT payload
    const payload = {
      aud: audience,
      exp: now + 12 * 60 * 60, // 12 hours expiration
      sub: subject
    };
    
    // Encode header and payload as base64url
    const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
    const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    
    // Create the signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    
    // Import the private key
    const privateKeyDer = base64ToUint8Array(privateKey);
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyDer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['sign']
    );
    
    // Sign the token
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );
    
    // Encode the signature as base64url
    const encodedSignature = uint8ArrayToBase64Url(new Uint8Array(signature));
    
    // Return the complete JWT token
    return `${signingInput}.${encodedSignature}`;
  } catch (error) {
    console.error('[PushNotification] Error creating VAPID JWT token:', error);
    throw new Error(`Failed to create JWT token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Encrypt the payload for Web Push
async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  payload: string
): Promise<{ cipherText: ArrayBuffer; contentEncoding: string } | null> {
  try {
    // Simplified implementation - in a real scenario, this would need to
    // properly implement the Web Push encryption protocol
    console.log("[PushNotification] Web Push encryption not fully implemented");
    console.log("[PushNotification] Using a simple implementation for testing");
    
    // For now, just return the payload as ArrayBuffer for testing
    // This will not work with actual push services which require proper encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    
    return {
      cipherText: data.buffer,
      contentEncoding: 'aes128gcm' // Or 'aesgcm' depending on what the push service supports
    };
  } catch (error) {
    console.error('[PushNotification] Error encrypting payload:', error);
    return null;
  }
}
