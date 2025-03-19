
/**
 * Command to invoke the CLI push notification function using curl:
 * 
 * For sending by email:
 * curl -X POST https://kyjvfgbaidcotatpndpw.supabase.co/functions/v1/cli-push-notification \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5anZmZ2JhaWRjb3RhdHBuZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTMyMDYsImV4cCI6MjA1NzAyOTIwNn0.96KP_zfQiKZz5Ce2-lfOcMTzuYaI52bqHti2Ay84cvI" \
 *   -d '{"email": "user@example.com", "title": "Test Notification", "message": "Hello from CLI!", "url": "/profile"}'
 * 
 * For sending by user_id:
 * curl -X POST https://kyjvfgbaidcotatpndpw.supabase.co/functions/v1/cli-push-notification \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5anZmZ2JhaWRjb3RhdHBuZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTMyMDYsImV4cCI6MjA1NzAyOTIwNn0.96KP_zfQiKZz5Ce2-lfOcMTzuYaI52bqHti2Ay84cvI" \
 *   -d '{"user_id": "user-uuid-here", "title": "Test Notification", "message": "Hello from CLI!", "url": "/profile"}'
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
    // Get the current session
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token || '';

    const response = await supabase.functions.invoke('cli-push-notification', {
      body: { email, title, message, url },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (response.error) {
      console.error('Error sending notification:', response.error);
      return { success: false, error: response.error };
    }
    
    return response.data;
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
    // Get the current session
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token || '';

    const response = await supabase.functions.invoke('cli-push-notification', {
      body: { user_id: userId, title, message, url },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (response.error) {
      console.error('Error sending notification:', response.error);
      return { success: false, error: response.error };
    }
    
    return response.data;
  } catch (err) {
    console.error('Exception sending notification:', err);
    return { success: false, error: err };
  }
}
