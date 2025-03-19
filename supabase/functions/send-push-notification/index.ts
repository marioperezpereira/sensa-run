import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { base64ToUint8Array, uint8ArrayToBase64Url, formatVapidKey } from './utils.ts'

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
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

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
          // Check if this is an FCM endpoint
          if (subscription.endpoint.includes('fcm.googleapis.com/fcm/send/')) {
            // For FCM endpoints, we need to extract the FCM token
            const fcmToken = subscription.endpoint.split('fcm.googleapis.com/fcm/send/')[1];
            console.log(`[PushNotification] FCM token extracted: ${fcmToken}`);
            
            if (!fcmServerKey) {
              console.error('[PushNotification] FCM_SERVER_KEY not configured');
              results.push({
                success: false,
                error: 'FCM_SERVER_KEY not configured',
                endpoint: subscription.endpoint
              });
              continue;
            }
            
            const fcmResult = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${fcmServerKey}`
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
            
            // Check if we got a valid response
            if (fcmResult.ok) {
              const responseText = await fcmResult.text();
              console.log(`[PushNotification] FCM response: ${fcmResult.status} ${responseText}`);
              results.push({ 
                success: true, 
                endpoint: subscription.endpoint,
                provider: 'fcm'
              });
            } else {
              const errorText = await fcmResult.text();
              console.error(`[PushNotification] FCM error: ${fcmResult.status} ${errorText}`);
              results.push({ 
                success: false, 
                error: `FCM error: ${fcmResult.status} ${errorText}`,
                endpoint: subscription.endpoint
              });
            }
            continue;
          }
          
          // Check if this is an Apple push endpoint
          if (subscription.endpoint.includes('web.push.apple.com')) {
            try {
              console.log('[PushNotification] Processing Apple Web Push notification');
              
              // Create the JWT for Apple Web Push API
              // Generate a JWT token expiring in 12 hours
              const now = Math.floor(Date.now() / 1000);
              const expiresAt = now + 12 * 60 * 60; // 12 hours
              
              // Create the JWT header and payload
              const jwtHeader = {
                typ: "JWT",
                alg: "ES256"
              };
              
              const jwtPayload = {
                aud: new URL(subscription.endpoint).origin,
                exp: expiresAt,
                sub: vapidSubject
              };
              
              // Encode the JWT header and payload
              const encodeBase64Url = (input: string): string => {
                return btoa(input)
                  .replace(/=/g, '')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_');
              };
              
              const encodedHeader = encodeBase64Url(JSON.stringify(jwtHeader));
              const encodedPayload = encodeBase64Url(JSON.stringify(jwtPayload));
              const unsignedToken = `${encodedHeader}.${encodedPayload}`;
              
              console.log('[PushNotification] Preparing to format VAPID private key');
              
              // Format the VAPID private key and import it
              const formattedKey = formatVapidKey(vapidPrivateKey);
              
              console.log('[PushNotification] Importing VAPID private key for signing');
              console.log(`[PushNotification] Key length: ${formattedKey.length} bytes`);
              
              // Try to debug the key format
              let keyHexString = '';
              for (let i = 0; i < Math.min(16, formattedKey.length); i++) {
                keyHexString += formattedKey[i].toString(16).padStart(2, '0') + ' ';
              }
              console.log(`[PushNotification] Key prefix (hex): ${keyHexString}...`);
              
              // Import the key with explicit settings
              const privateKey = await crypto.subtle.importKey(
                'pkcs8',
                formattedKey,
                {
                  name: 'ECDSA',
                  namedCurve: 'P-256',
                },
                false,
                ['sign']
              );
              
              console.log('[PushNotification] Successfully imported key, signing JWT');
              
              // Sign the token
              const encoder = new TextEncoder();
              const signatureBuffer = await crypto.subtle.sign(
                { name: 'ECDSA', hash: { name: 'SHA-256' } },
                privateKey,
                encoder.encode(unsignedToken)
              );
              
              // Convert the signature to base64url
              const signature = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
              
              // Create the complete JWT token
              const jwtToken = `${unsignedToken}.${signature}`;
              
              console.log('[PushNotification] JWT token created, sending push notification');
              
              // Send the push notification with the proper headers
              const response = await fetch(subscription.endpoint, {
                method: 'POST',
                headers: {
                  'TTL': '86400',
                  'Content-Type': 'application/octet-stream',
                  'Authorization': `vapid t=${jwtToken}, k=${vapidPublicKey}`
                },
                body: payload
              });
              
              if (response.ok) {
                console.log('[PushNotification] Apple Web Push notification sent successfully');
                results.push({ 
                  success: true,
                  endpoint: subscription.endpoint,
                  provider: 'apple' 
                });
              } else {
                const responseText = await response.text();
                console.error(`[PushNotification] Apple Web Push error: ${response.status} ${responseText}`);
                results.push({ 
                  success: false, 
                  error: `Apple Web Push error: ${response.status} ${responseText}`,
                  endpoint: subscription.endpoint 
                });
              }
            } catch (keyError) {
              console.error('[PushNotification] Error during key operations:', keyError);
              results.push({
                success: false,
                error: `Error during key operations: ${keyError instanceof Error ? keyError.message : String(keyError)}`,
                endpoint: subscription.endpoint
              });
            }
          }
          
          // For all other Push Service endpoints (Firefox, etc.)
          // Use a simple approach with minimal headers
          const result = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'TTL': '60'
            }
          });
          
          if (result.ok) {
            console.log(`[PushNotification] Successfully sent notification to endpoint: ${subscription.endpoint}`);
            results.push({ 
              success: true, 
              endpoint: subscription.endpoint,
              provider: 'standard'
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
            endpoint: item.subscription?.endpoint || 'unknown'
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
