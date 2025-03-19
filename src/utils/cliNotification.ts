
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
import { toast } from "sonner";

// Define the anon key as a fallback
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5anZmZ2JhaWRjb3RhdHBuZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NTMyMDYsImV4cCI6MjA1NzAyOTIwNn0.96KP_zfQiKZz5Ce2-lfOcMTzuYaI52bqHti2Ay84cvI';

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
    console.log('[CLI-Notification] Sending notification to email:', email);
    toast.info('Enviando notificación...');
    
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || ANON_KEY;

    // Use direct fetch to avoid any potential issues with the Supabase client
    const response = await fetch('https://kyjvfgbaidcotatpndpw.supabase.co/functions/v1/cli-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ email, title, message, url })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[CLI-Notification] Error sending notification:', result);
      toast.error(`Error al enviar la notificación: ${result.error || response.statusText}`);
      return { success: false, error: result.error || response.statusText };
    }
    
    console.log('[CLI-Notification] Notification sent successfully:', result);
    
    if (result.success) {
      toast.success('Notificación enviada correctamente');
    } else {
      toast.error(`Error: ${result.error || 'No se pudo enviar la notificación'}`);
    }
    
    return result;
  } catch (err) {
    console.error('[CLI-Notification] Exception sending notification:', err);
    toast.error(`Error al enviar la notificación: ${err instanceof Error ? err.message : String(err)}`);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
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
    console.log('[CLI-Notification] Sending notification to user ID:', userId);
    toast.info('Enviando notificación...');
    
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || ANON_KEY;

    // Use direct fetch to avoid any potential issues with the Supabase client
    const response = await fetch('https://kyjvfgbaidcotatpndpw.supabase.co/functions/v1/cli-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ user_id: userId, title, message, url })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[CLI-Notification] Error sending notification:', result);
      toast.error(`Error al enviar la notificación: ${result.error || response.statusText}`);
      return { success: false, error: result.error || response.statusText };
    }
    
    console.log('[CLI-Notification] Notification sent successfully:', result);
    
    if (result.success) {
      toast.success('Notificación enviada correctamente');
    } else {
      toast.error(`Error: ${result.error || 'No se pudo enviar la notificación'}`);
    }
    
    return result;
  } catch (err) {
    console.error('[CLI-Notification] Exception sending notification:', err);
    toast.error(`Error al enviar la notificación: ${err instanceof Error ? err.message : String(err)}`);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
