import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    // Check if there's already a recommendation for today
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingRec } = await supabase
      .from('training_recommendations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .maybeSingle();

    if (existingRec) {
      return new Response(
        JSON.stringify({ 
          recommendation: existingRec.recommendation,
          existingRecommendation: true,
          hasFeedback: !!existingRec.feedback
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Eres un entrenador de atletismo experto que proporciona recomendaciones de entrenamiento personalizadas. Analiza cuidadosamente el historial de entrenamientos, las percepciones subjetivas del atleta y sus objetivos para crear recomendaciones seguras y efectivas. Adapta siempre tus sugerencias al nivel actual del atleta y su estado físico y mental.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      
      // More specific error handling
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error('Invalid request to OpenAI API');
      } else {
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    // Store the recommendation
    const { error: insertError } = await supabase
      .from('training_recommendations')
      .insert({
        user_id: userId,
        prompt,
        recommendation,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        recommendation,
        existingRecommendation: false,
        hasFeedback: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
