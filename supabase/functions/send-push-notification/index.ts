import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { base64ToUint8Array, uint8ArrayToBase64Url, generateAppleJWT } from './utils.ts'

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

    console.log(`[PushNotification] VAPID details - Subject: ${vapidSubject}`);
    console.log(`[PushNotification] Public key exists: ${!!vapidPublicKey}, Private key exists: ${!!vapidPrivateKey}`);

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
        
        const notificationPayload = JSON.stringify({
          title: title || 'Sensa.run',
          body: message || 'Tienes una notificación nueva',
          icon: '/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png',
          url: url || '/',
        });
        
        // Handle FCM notifications
        if (subscription.endpoint.includes('fcm.googleapis.com/fcm/send/')) {
          try {
            const fcmToken = subscription.endpoint.split('fcm.googleapis.com/fcm/send/')[1];
            console.log(`[PushNotification] Detected FCM endpoint, token: ${fcmToken}`);
            
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
            
            console.log(`[PushNotification] FCM Request:
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
                method: 'fcm'
              });
            } else {
              results.push({ 
                success: false, 
                error: `FCM error: ${result.status} ${responseText}`,
                endpoint: subscription.endpoint
              });
            }
            continue;
          } catch (fcmError) {
            console.error('[PushNotification] FCM error:', fcmError);
            results.push({ 
              success: false, 
              error: `FCM error: ${fcmError instanceof Error ? fcmError.message : String(fcmError)}`,
              endpoint: subscription.endpoint
            });
            continue;
          }
        }
        
        // Handle Apple Web Push notifications
        if (subscription.endpoint.includes('web.push.apple.com')) {
          try {
            console.log('[PushNotification] Detected Apple Web Push endpoint');
            
            // Generate JWT token for Apple Web Push using the updated function
            const jwt = await generateAppleJWT(vapidSubject, vapidPrivateKey, vapidPublicKey);
            console.log('[PushNotification] Generated JWT for Apple Web Push (length):', jwt.length);
            
            // Apple requires a specific JSON payload format
            const applePayload = JSON.stringify({
              aps: {
                alert: {
                  title: title || 'Sensa.run',
                  body: message || 'Tienes una notificación nueva'
                },
                url: url || '/'
              }
            });
            
            // Ensure all required headers are present for Apple Web Push
            const appleHeaders = {
              'Content-Type': 'application/json',
              'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
              'Content-Length': `${applePayload.length}`,
              'TTL': '2419200',
              'Topic': 'web.push',  // Apple requires this to be exactly 'web.push'
              'apns-priority': '10', // High priority
              'apns-push-type': 'alert',  // Required for Safari 16+
              'apns-expiration': '0'  // '0' means the notification won't expire
            };
            
            console.log('[PushNotification] Apple Web Push Request Headers:', 
              JSON.stringify({
                ...appleHeaders, 
                'Authorization': 'vapid t=[JWT_TOKEN_HIDDEN], k=[VAPID_KEY_HIDDEN]'
              }, null, 2)
            );
            console.log('[PushNotification] Apple Web Push Payload:', applePayload);
            
            const appleResponse = await fetch(subscription.endpoint, {
              method: 'POST',
              headers: appleHeaders,
              body: applePayload
            });
            
            let appleResponseText = '';
            try {
              appleResponseText = await appleResponse.text();
            } catch (e) {
              appleResponseText = 'No response text';
            }
            
            console.log(`[PushNotification] Apple Web Push response:
              Status: ${appleResponse.status}
              Response: ${appleResponseText}
              Headers: ${JSON.stringify(Object.fromEntries(appleResponse.headers.entries()))}
            `);
            
            // Detailed error handling for Apple Web Push
            if (appleResponse.ok) {
              console.log('[PushNotification] Successfully sent notification to Apple Web Push');
              results.push({
                success: true,
                endpoint: subscription.endpoint,
                method: 'apple'
              });
            } else {
              let errorDetails = appleResponseText;
              
              // Check for specific error codes and give more helpful messages
              if (appleResponse.status === 403) {
                errorDetails = `BadJwtToken: ${appleResponseText} - Likely causes: 1) Incorrect VAPID key format, 2) JWT signing issue, 3) Expired token`;
                // Add more detailed debugging info for BadJwtToken error
                console.error(`[PushNotification] JWT Error Details: Subject: "${vapidSubject}", JWT Length: ${jwt.length}, Formatted Subject Used: "${formattedSubject}"`);
              } else if (appleResponse.status === 404) {
                errorDetails = `Subscription not found: ${appleResponseText} - Device may have unsubscribed`;
              } else if (appleResponse.status === 400) {
                errorDetails = `Bad Request: ${appleResponseText} - Check payload format and headers`;
              } else if (appleResponse.status === 429) {
                errorDetails = `Rate Limited: ${appleResponseText} - Too many requests to Apple Push service`;
              }
              
              console.error(`[PushNotification] Apple Web Push error: ${appleResponse.status} ${errorDetails}`);
              results.push({
                success: false,
                error: `Apple Web Push error: ${appleResponse.status} ${errorDetails}`,
                endpoint: subscription.endpoint,
                method: 'apple',
                status: appleResponse.status
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
        
        // Handle standard Web Push notifications
        try {
          console.log(`[PushNotification] Using standard Web Push for: ${subscription.endpoint}`);
          
          // For standard Web Push, just try sending the notification directly
          const standardPushHeaders = {
            'TTL': '60'
          };
          
          console.log(`[PushNotification] Standard Web Push Request:
            URL: ${subscription.endpoint}
            Headers: ${JSON.stringify(standardPushHeaders)}
            Payload: ${notificationPayload.length} bytes
          `);
          
          const result = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: standardPushHeaders,
            body: notificationPayload
          });
          
          let responseText = '';
          try {
            responseText = await result.text();
          } catch (e) {
            responseText = 'No response text';
          }
          
          console.log(`[PushNotification] Standard Web Push response: ${result.status} ${responseText}`);
          
          if (result.ok) {
            console.log(`[PushNotification] Successfully sent notification to: ${subscription.endpoint}`);
            results.push({ 
              success: true, 
              endpoint: subscription.endpoint,
              method: 'standard'
            });
          } else {
            const statusCode = result.status;
            let errorMessage = `HTTP Error ${statusCode}: ${responseText}`;
            
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
              endpoint: subscription.endpoint,
              method: 'standard'
            });
          }
        } catch (standardPushError) {
          console.error(`[PushNotification] Error with standard Web Push:`, standardPushError);
          results.push({ 
            success: false, 
            error: standardPushError instanceof Error ? standardPushError.message : String(standardPushError),
            endpoint: subscription.endpoint,
            method: 'standard'
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

    // Check if any notifications were successfully sent
    const anySuccessful = results.some(r => r.success);
    
    return new Response(
      JSON.stringify({ 
        success: anySuccessful, 
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
