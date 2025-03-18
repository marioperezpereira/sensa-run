
import { supabase } from "@/integrations/supabase/client";

export async function registerPushNotifications() {
  try {
    console.log("Starting push notification registration");
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push is supported
    if (!('pushManager' in registration)) {
      console.error('Push notifications not supported by this browser');
      return null;
    }

    let subscription = await registration.pushManager.getSubscription();
    
    // If a subscription already exists, return it
    if (subscription) {
      console.log('Existing push subscription found:', subscription);
      await savePushSubscription(subscription);
      return subscription;
    }

    // Get VAPID public key from backend
    console.log("Fetching VAPID public key");
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    
    if (error || !data || !data.publicKey) {
      console.error('Could not get VAPID public key:', error || 'No key returned');
      return null;
    }

    console.log("VAPID public key received:", data.publicKey);

    // Convert base64 string to Uint8Array
    const applicationServerKey = urlB64ToUint8Array(data.publicKey);

    // Create new subscription with user visible only set to true
    console.log("Creating new push subscription");
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('Push notification subscription created:', subscription);
      
      // Save the subscription to the database
      await savePushSubscription(subscription);
      
      return subscription;
    } catch (subscribeError) {
      console.error('Error subscribing to push notifications:', subscribeError);
      return null;
    }
    
  } catch (err) {
    console.error('Error setting up push notifications:', err);
    return null;
  }
}

// Save push subscription to the database
async function savePushSubscription(subscription: PushSubscription) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user found when saving push subscription');
      return;
    }
    
    console.log('Saving push subscription for user:', user.id);
    
    // Check if subscription already exists for this user
    const { data: existingSubscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint);
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Update existing subscription
      await supabase
        .from('push_subscriptions')
        .update({
          subscription: JSON.parse(JSON.stringify(subscription)),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscriptions[0].id);
        
      console.log('Updated existing push subscription');
      return;
    }
    
    // Save new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription: JSON.parse(JSON.stringify(subscription))
      });
      
    if (error) {
      console.error('Error saving push subscription:', error);
    } else {
      console.log('Saved new push subscription');
    }
  } catch (error) {
    console.error('Error in savePushSubscription:', error);
  }
}

// Helper function to convert VAPID key from base64 to Uint8Array
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
