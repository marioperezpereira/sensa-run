import { supabase } from "@/integrations/supabase/client";

export async function registerPushNotifications() {
  try {
    console.log("[Notifications] Starting push notification registration");
    
    // Check for service worker support
    if (!('serviceWorker' in navigator)) {
      console.error("[Notifications] Service Workers not supported by this browser");
      return null;
    }
    
    // Check for Push API support
    if (!('PushManager' in window)) {
      console.error("[Notifications] Push notifications not supported by this browser");
      return null;
    }

    // Check for notification permission
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error("[Notifications] Notification permission denied");
        return null;
      }
    }

    const registration = await navigator.serviceWorker.ready;
    console.log("[Notifications] ServiceWorker ready:", registration);
    
    // If a subscription already exists, return it
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log('[Notifications] Existing push subscription found:', subscription);
      await savePushSubscription(subscription);
      return subscription;
    }

    // Get VAPID public key from backend
    console.log("[Notifications] Fetching VAPID public key");
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    
    if (error || !data || !data.publicKey) {
      console.error('[Notifications] Could not get VAPID public key:', error || 'No key returned');
      return null;
    }

    console.log("[Notifications] VAPID public key received. Length:", data.publicKey.length);

    // Convert base64 string to Uint8Array with proper handling of URL-safe base64
    const applicationServerKey = urlB64ToUint8Array(data.publicKey);
    console.log("[Notifications] Converted application server key length:", applicationServerKey.length);

    // Create new subscription with proper userVisibleOnly
    console.log("[Notifications] Creating new push subscription");
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('[Notifications] Push notification subscription created:', subscription);
      
      // Save the subscription to the database
      await savePushSubscription(subscription);
      
      // Display a test notification to confirm permission
      new Notification('Sensa.run', {
        body: 'Las notificaciones están funcionando correctamente',
        icon: "/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png",
      });
      
      return subscription;
    } catch (subscribeError) {
      console.error('[Notifications] Error subscribing to push notifications:', subscribeError);
      return null;
    }
    
  } catch (err) {
    console.error('[Notifications] Error setting up push notifications:', err);
    return null;
  }
}

// Save push subscription to the database
async function savePushSubscription(subscription: PushSubscription) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[Notifications] No user found when saving push subscription');
      return;
    }
    
    console.log('[Notifications] Saving push subscription for user:', user.id);
    
    // Clean the subscription object to ensure it can be serialized properly
    const cleanedSubscription = JSON.parse(JSON.stringify(subscription));
    
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
          subscription: cleanedSubscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscriptions[0].id);
        
      console.log('[Notifications] Updated existing push subscription');
      return;
    }
    
    // Save new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription: cleanedSubscription
      });
      
    if (error) {
      console.error('[Notifications] Error saving push subscription:', error);
    } else {
      console.log('[Notifications] Saved new push subscription');
    }
  } catch (error) {
    console.error('[Notifications] Error in savePushSubscription:', error);
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
