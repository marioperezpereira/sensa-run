
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
    
    // Call our Supabase Edge Function to send the push notification
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: { user_id: userId, title, message, url }
    });
    
    if (error) {
      console.error('[SendNotification] Error invoking function:', error);
      toast.error(`Error al enviar la notificación: ${error.message}`);
      return { success: false, error };
    }
    
    console.log('[SendNotification] Push notification result:', data);
    
    if (data.success) {
      toast.success("Notificación enviada correctamente");
      return data;
    } else {
      let errorMessage = data.error || "Error al enviar la notificación";
      // Check if there are more specific errors in the results
      if (data.results && Array.isArray(data.results)) {
        const errors = data.results
          .filter(r => !r.success && r.error)
          .map(r => r.error);
          
        if (errors.length > 0) {
          errorMessage = errors.join(', ');
        }
      }
      
      toast.error(errorMessage);
      return data;
    }
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
