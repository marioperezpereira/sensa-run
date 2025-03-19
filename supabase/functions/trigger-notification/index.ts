
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase connection details not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get request body with notification details
    const { user_id, title, message, url, trigger_type } = await req.json();
    
    if (!user_id) {
      throw new Error('User ID is required');
    }
    
    console.log(`[TriggerNotification] Sending notification to user: ${user_id} from ${trigger_type || 'direct call'}`);
    
    // Call the existing send-push-notification function
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: { user_id, title, message, url }
    });

    if (error) {
      throw new Error(`Error invoking push notification: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[TriggerNotification] Error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
