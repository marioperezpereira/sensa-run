import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { base64ToUint8Array, uint8ArrayToBase64Url, formatVapidKey } from './utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, message, url, specific_subscription } = await req.json();
    
    if (!user_id && !specific_subscription) {
      throw new Error('Either user_id or specific_subscription is required');
    }

    console.log(`[PushNotification] Processing request for user: ${user_id || 'specific subscription'}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase connection details not configured');
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error('VAPID configuration missing');
    }

    console.log(`[PushNotification] VAPID details - Subject: ${vapidSubject}, Public key exists: ${!!vapidPublicKey}, Private key exists: ${!!vapidPrivateKey}`);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    let subscriptionsToProcess = [];
    
    if (specific_subscription) {
      console.log(`[PushNotification] Using provided specific subscription`);
      console.log(`[PushNotification] Subscription endpoint: ${specific_subscription.endpoint}`);
      subscriptionsToProcess = [{ subscription: specific_subscription }];
    } else {
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
        
        const payload = JSON.stringify({
          title: title || 'Sensa.run',
          body: message || 'Tienes una notificación nueva',
          url: url || '/',
        });
        
        console.log(`[PushNotification] Sending notification to endpoint: ${subscription.endpoint}`);
        
        try {
          const simplified = true;
          
          if (simplified) {
            const notificationData = {
              endpoint: subscription.endpoint,
              keys: subscription.keys,
              payload: {
                notification: {
                  title: title || 'Sensa.run',
                  body: message || 'Tienes una notificación nueva',
                  icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
                  click_action: url || '/',
                  data: {
                    url: url || '/'
                  }
                }
              }
            };
            
            let isFCM = false;
            let fcmToken = '';
            
            if (subscription.endpoint.includes('fcm.googleapis.com/fcm/send/')) {
              isFCM = true;
              fcmToken = subscription.endpoint.split('fcm.googleapis.com/fcm/send/')[1];
              console.log(`[PushNotification] FCM token extracted: ${fcmToken}`);
            }
            
            if (isFCM) {
              const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
              if (!fcmServerKey) {
                console.error('[PushNotification] FCM_SERVER_KEY is not configured');
                results.push({ 
                  success: false, 
                  error: 'FCM_SERVER_KEY is not configured',
                  endpoint: subscription.endpoint
                });
                continue;
              }
              
              const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
              const fcmPayload = {
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
              };
              
              const fcmHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `key=${fcmServerKey}`
              };
              
              console.log(`[PushNotification] FCM Request details:
                URL: ${fcmUrl}
                Headers: ${JSON.stringify(fcmHeaders)}
                Payload: ${JSON.stringify(fcmPayload)}
              `);
              
              const result = await fetch(fcmUrl, {
                method: 'POST',
                headers: fcmHeaders,
                body: JSON.stringify(fcmPayload)
              });
              
              const responseText = await result.text();
              console.log(`[PushNotification] FCM response: ${result.status} ${responseText}`);
              
              if (result.ok) {
                results.push({ 
                  success: true, 
                  endpoint: subscription.endpoint,
                  simplified: true
                });
              } else {
                results.push({ 
                  success: false, 
                  error: `FCM error: ${result.status} ${responseText}`,
                  endpoint: subscription.endpoint
                });
              }
              continue;
            }
            
            if (subscription.endpoint.includes('web.push.apple.com')) {
              try {
                console.log('[PushNotification] Processing Apple Web Push notification');
                
                const currentTime = Math.floor(Date.now() / 1000);
                const expirationTime = currentTime + 60 * 60; // 1 hour expiration
                
                const jwtHeader = {
                  alg: 'ES256',
                  typ: 'JWT'
                };
                
                const jwtPayload = {
                  iss: vapidSubject,
                  iat: currentTime,
                  exp: expirationTime
                };
                
                const headerBase64 = btoa(JSON.stringify(jwtHeader))
                  .replace(/=/g, '')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_');
                
                const payloadBase64 = btoa(JSON.stringify(jwtPayload))
                  .replace(/=/g, '')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_');
                
                const unsignedToken = `${headerBase64}.${payloadBase64}`;
                
                console.log('[PushNotification] Formatting VAPID private key for JWT signing');
                
                let privateKeyArrayBuffer;
                try {
                  privateKeyArrayBuffer = formatVapidKey(vapidPrivateKey);
                  console.log('[PushNotification] Private key formatted successfully, length:', privateKeyArrayBuffer.byteLength);
                } catch (keyError) {
                  console.error('[PushNotification] Error formatting private key:', keyError);
                  throw new Error(`Error formatting VAPID key: ${keyError instanceof Error ? keyError.message : String(keyError)}`);
                }
                
                console.log('[PushNotification] Importing private key for JWT signing');
                
                let privateKey;
                try {
                  privateKey = await crypto.subtle.importKey(
                    'pkcs8',
                    privateKeyArrayBuffer,
                    {
                      name: 'ECDSA',
                      namedCurve: 'P-256'
                    },
                    false,
                    ['sign']
                  );
                  console.log('[PushNotification] Private key imported successfully');
                } catch (importError) {
                  console.error('[PushNotification] Error importing key:', importError);
                  console.error('[PushNotification] Error during key operations:', importError);
                  throw new Error(`Error importing key: ${importError instanceof Error ? importError.message : String(importError)}`);
                }
                
                console.log('[PushNotification] Signing JWT token');
                const textEncoder = new TextEncoder();
                const signatureArrayBuffer = await crypto.subtle.sign(
                  {
                    name: 'ECDSA',
                    hash: { name: 'SHA-256' }
                  },
                  privateKey,
                  textEncoder.encode(unsignedToken)
                );
                
                const signatureBase64 = uint8ArrayToBase64Url(new Uint8Array(signatureArrayBuffer));
                
                const jwt = `${unsignedToken}.${signatureBase64}`;
                
                console.log('[PushNotification] JWT token created successfully');
                
                const applePayload = JSON.stringify({
                  aps: {
                    alert: {
                      title: title || 'Sensa.run',
                      body: message || 'Tienes una notificación nueva'
                    },
                    url: url || '/'
                  }
                });
                
                const appleHeaders = {
                  'Content-Type': 'application/json',
                  'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
                  'Content-Length': `${applePayload.length}`,
                  'TTL': '2419200'
                };
                
                console.log(`[PushNotification] Apple Web Push Request details:
                  URL: ${subscription.endpoint}
                  Headers: ${JSON.stringify(appleHeaders)}
                  Payload: ${applePayload}
                `);
                
                const appleResponse = await fetch(subscription.endpoint, {
                  method: 'POST',
                  headers: appleHeaders,
                  body: applePayload
                });
                
                const appleResponseText = await appleResponse.text();
                console.log(`[PushNotification] Apple Web Push response: ${appleResponse.status} ${appleResponseText}`);
                
                if (appleResponse.ok) {
                  console.log('[PushNotification] Successfully sent notification to Apple Web Push');
                  results.push({
                    success: true,
                    endpoint: subscription.endpoint
                  });
                } else {
                  console.error(`[PushNotification] Apple Web Push error: ${appleResponse.status} ${appleResponseText}`);
                  results.push({
                    success: false,
                    error: `Apple Web Push error: ${appleResponse.status} ${appleResponseText}`,
                    endpoint: subscription.endpoint
                  });
                }
                
                continue;
              } catch (appleError) {
                console.error('[PushNotification] Error with Apple Web Push:', appleError);
                results.push({
                  success: false,
                  error: `Apple Web Push error: ${appleError instanceof Error ? appleError.message : String(appleError)}`,
                  endpoint: subscription.endpoint
                });
                continue;
              }
            }
            
            console.log(`[PushNotification] Standard Push Request details:
              URL: ${subscription.endpoint}
              Headers: { 'TTL': '60' }
              Payload: ${payload}
            `);
            
            const result = await fetch(subscription.endpoint, {
              method: 'POST',
              headers: {
                'TTL': '60'
              },
              body: payload
            });
            
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
