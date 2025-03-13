
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";

export const generateTrainingPrompt = async (latestActivity: any, effort: number | null | undefined, energy: number, condition: string | null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!onboarding) throw new Error('No onboarding data found');

    const { data: activities } = await supabase.functions.invoke('fetch-strava-activities', {
      body: { user_id: user.id }
    });

    let recentActivitiesText = '';
    let averageDistanceText = '';

    if (activities?.activities && activities.activities.length > 0) {
      const recentActivities = activities.activities.slice(0, 5);
      recentActivitiesText = recentActivities.map(activity => {
        const date = format(new Date(activity.start_date), "d 'de' MMMM", { locale: es });
        const distance = (activity.distance / 1000).toFixed(2);
        let durationText = '';
        if (activity.moving_time) {
          const minutes = Math.floor(activity.moving_time / 60);
          if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            durationText = `${hours}h ${remainingMinutes}min`;
          } else {
            durationText = `${minutes} minutos`;
          }
        }
        return `- ${activity.name}, ${distance}km el ${date}${durationText ? ` en ${durationText}` : ''}`;
      }).join('\n');
    }

    const conditionText = {
      'physical_discomfort': 'molestias físicas',
      'mild_cold': 'algo resfriado',
      'stressed': 'estrés',
      'stomach_issues': 'problemas estomacales',
      'all_good': 'perfectamente'
    }[condition || 'all_good'];

    let lastActivityText = '';
    if (latestActivity) {
      lastActivityText = effort !== null && effort !== undefined
        ? `En su último entrenamiento corrió ${(latestActivity.distance / 1000).toFixed(2)}km y su percepción de esfuerzo fue de ${effort} sobre 10.`
        : `En su último entrenamiento corrió ${(latestActivity.distance / 1000).toFixed(2)}km.`;
    }

    return `Eres un entrenador de atletismo de alto nivel, aunque entrenas a gente de todos los ámbitos y niveles. Estás entrenando a un atleta que lleva corriendo regularmente ${onboarding.running_experience}.

Suele entrenar ${onboarding.weekly_frequency.toLowerCase()} a la semana.${recentActivitiesText ? `\n\nEstos son sus últimos entrenamientos:\n${recentActivitiesText}` : ''}

${averageDistanceText ? `${averageDistanceText}\n\n` : ''}Hoy es ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}, ${
      onboarding.goal_type === "Quiero preparar una carrera lo mejor posible" 
        ? `y se está preparando para correr ${onboarding.race_distance || 'una carrera'} el ${format(new Date(onboarding.race_date || ''), "d 'de' MMMM 'de' yyyy", { locale: es })}.` 
        : 'y entrena para mantenerse en forma.'
    }

${lastActivityText ? `${lastActivityText} ` : ''}Su percepción de niveles de energía es de ${energy} sobre 10 (siendo 10 completamente descansado y 1 nada descansado). Se encuentra con ${conditionText}.

Basado en las percepciones personales, objetivos e historial de entrenamientos, sugiere un entrenamiento para el usuario a realizar en el día de hoy. El formato en que lo aportes debe incluir un título de no más de 10 palabras explicando en qué consiste el entrenamiento, una descripción en la cual se explique de forma más detallada cómo se ha de ejecutar el entrenamiento y sensaciones que debe tener mientras lo ejecute (se pueden aportar ritmos como guía para no exceder, pero principalmente la recomendación debe girar en torno a las percepciones del usuario), y debe también incluir una sesión alternativa a realizar en caso de que no le encaje la recomendada al usuario.`;
  } catch (error) {
    console.error('Error generating prompt:', error);
    return '';
  }
};
