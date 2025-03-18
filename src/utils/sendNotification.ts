
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Sends a push notification to a specific user
 * @param userId The user ID to send the notification to
 * @param title Notification title
 * @param message Notification message
 * @param url Optional URL to open when notification is clicked
 * @returns Promise that resolves with the result of the operation
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  message: string,
  url?: string
) {
  try {
    console.log('[SendNotification] Sending notification to user:', userId);
    
    // Add a toast notification to provide immediate feedback
    toast.info("Enviando notificación...");
    
    // Add some logging to help with debugging
    const response = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title, 
        message,
        url: url || '/',
        tag: `sensa-${Date.now()}` // Adding a unique tag to avoid notification coalescing
      }
    });

    // Improved error handling
    if (response.error) {
      console.error('[SendNotification] Error sending notification:', response.error);
      toast.error("Error al enviar la notificación");
      return { success: false, error: response.error };
    }

    console.log('[SendNotification] Notification sent successfully:', response.data);
    toast.success("Notificación enviada correctamente");
    return { success: true, data: response.data };
  } catch (err) {
    console.error('[SendNotification] Exception sending notification:', err);
    toast.error("Error al enviar la notificación");
    return { success: false, error: err };
  }
}

/**
 * Checks if the current browser has a push subscription and saves it to the database
 * @returns Promise that resolves to the subscription or null
 */
export async function checkAndSaveExistingSubscription() {
  try {
    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      console.log('[SendNotification] Service Worker not supported');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push is supported
    if (!('pushManager' in registration)) {
      console.log('[SendNotification] Push notifications not supported');
      return null;
    }

    // Get existing subscription
    const subscription = await registration.pushManager.getSubscription();
    
    // No subscription found
    if (!subscription) {
      console.log('[SendNotification] No push subscription found');
      return null;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[SendNotification] No user found, cannot save subscription');
      return subscription; // Return subscription anyway for potential anonymous use
    }
    
    console.log('[SendNotification] Found existing push subscription:', subscription);
    
    // Try to save the subscription to the database
    const { data: existingSubscriptions, error: selectError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint);
    
    if (selectError) {
      console.error('[SendNotification] Error checking for existing subscription:', selectError);
      return subscription;
    }
    
    // Only save if not already in database
    if (!existingSubscriptions || existingSubscriptions.length === 0) {
      // Save new subscription
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription: JSON.parse(JSON.stringify(subscription))
        });
        
      if (insertError) {
        console.error('[SendNotification] Error saving push subscription:', insertError);
      } else {
        console.log('[SendNotification] Recovered and saved existing push subscription');
      }
    } else {
      console.log('[SendNotification] Subscription already exists in database');
    }
    
    return subscription;
  } catch (err) {
    console.error('[SendNotification] Error checking for existing subscription:', err);
    return null;
  }
}

/**
 * Send a test notification to the current user
 */
export async function sendTestNotification() {
  try {
    console.log('[SendNotification] Starting test notification process');
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[SendNotification] No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    
    // First check and save any existing subscription
    const subscription = await checkAndSaveExistingSubscription();
    
    if (!subscription) {
      console.error('[SendNotification] No push subscription available');
      return { success: false, error: 'No push subscription available' };
    }
    
    console.log('[SendNotification] Sending test notification to user:', user.id);
    // Send the notification
    return await sendNotificationToUser(
      user.id, 
      '¡Prueba de notificación!', 
      'Las notificaciones están funcionando correctamente. ' + new Date().toLocaleTimeString(),
      '/profile'
    );
  } catch (err) {
    console.error('[SendNotification] Error sending test notification:', err);
    return { success: false, error: err };
  }
}
