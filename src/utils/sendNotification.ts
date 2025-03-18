
import { supabase } from "@/integrations/supabase/client";

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
    console.log('Sending notification to user:', userId);
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title, 
        message,
        url: url || '/'
      }
    });

    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }

    console.log('Notification sent successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exception sending notification:', err);
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
      console.log('Service Worker not supported');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push is supported
    if (!('pushManager' in registration)) {
      console.log('Push notifications not supported');
      return null;
    }

    // Get existing subscription
    const subscription = await registration.pushManager.getSubscription();
    
    // No subscription found
    if (!subscription) {
      console.log('No push subscription found');
      return null;
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found, cannot save subscription');
      return subscription; // Return subscription anyway for potential anonymous use
    }
    
    // Try to save the subscription to the database
    const { data: existingSubscriptions, error: selectError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint);
    
    if (selectError) {
      console.error('Error checking for existing subscription:', selectError);
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
        console.error('Error saving push subscription:', insertError);
      } else {
        console.log('Recovered and saved existing push subscription');
      }
    } else {
      console.log('Subscription already exists in database');
    }
    
    return subscription;
  } catch (err) {
    console.error('Error checking for existing subscription:', err);
    return null;
  }
}

/**
 * Send a test notification to the current user
 */
export async function sendTestNotification() {
  try {
    console.log('Starting test notification process');
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    
    // First check and save any existing subscription
    const subscription = await checkAndSaveExistingSubscription();
    
    if (!subscription) {
      console.error('No push subscription available');
      return { success: false, error: 'No push subscription available' };
    }
    
    console.log('Sending test notification to user:', user.id);
    // Send the notification
    return await sendNotificationToUser(
      user.id, 
      '¡Prueba de notificación!', 
      'Las notificaciones están funcionando correctamente'
    );
  } catch (err) {
    console.error('Error sending test notification:', err);
    return { success: false, error: err };
  }
}
