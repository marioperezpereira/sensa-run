
/**
 * Command to invoke the CLI push notification function using curl:
 * 
 * For sending by email:
 * curl -X POST https://kyjvfgbaidcotatpndpw.supabase.co/functions/v1/cli-push-notification \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
 *   -d '{"email": "user@example.com", "title": "Test Notification", "message": "Hello from CLI!", "url": "/profile"}'
 * 
 * For sending by user_id:
 * curl -X POST https://kyjvfgbaidcotatpndpw.supabase.co/functions/v1/cli-push-notification \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
 *   -d '{"user_id": "user-uuid-here", "title": "Test Notification", "message": "Hello from CLI!", "url": "/profile"}'
 * 
 * Replace YOUR_SUPABASE_ANON_KEY with the actual Supabase anon key.
 * 
 * Note: The user must have previously registered for push notifications.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to send notification to a user by email
 */
export async function sendNotificationByEmail(
  email: string,
  title: string,
  message: string,
  url?: string
) {
  try {
    const { data, error } = await supabase.functions.invoke('cli-push-notification', {
      body: { email, title, message, url }
    });
    
    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
    
    return data;
  } catch (err) {
    console.error('Exception sending notification:', err);
    return { success: false, error: err };
  }
}

/**
 * Utility function to send notification to a user by user ID
 */
export async function sendNotificationByUserId(
  userId: string,
  title: string,
  message: string,
  url?: string
) {
  try {
    const { data, error } = await supabase.functions.invoke('cli-push-notification', {
      body: { user_id: userId, title, message, url }
    });
    
    if (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
    
    return data;
  } catch (err) {
    console.error('Exception sending notification:', err);
    return { success: false, error: err };
  }
}
