
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

    // Get user's personal bests
    const { data: profileData } = await supabase
      .from('user_pb_profiles')
      .select('gender, date_of_birth')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Get user's race results for context
    const { data: raceResults } = await supabase
      .from('race_results')
      .select('*')
      .eq('user_id', user.id)
      .order('race_date', { ascending: false })
      .limit(5);

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
        
        // Use elapsed_time instead of moving_time for more accurate training load assessment
        let durationText = '';
        if (activity.elapsed_time) {
          const minutes = Math.floor(activity.elapsed_time / 60);
          if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            durationText = `${hours}h ${remainingMinutes}min`;
          } else {
            durationText = `${minutes} minutos`;
          }
        }
        
        // Add heart rate data if available
        let heartRateText = '';
        if (activity.average_heartrate) {
          heartRateText = ` con frecuencia cardíaca media de ${Math.round(activity.average_heartrate)} ppm`;
        }
        
        // Add pace information if available
        let paceText = '';
        if (activity.average_speed && activity.average_speed > 0) {
          // Convert m/s to min/km
          const paceMinPerKm = 16.6667 / activity.average_speed;
          const paceMinutes = Math.floor(paceMinPerKm);
          const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
          paceText = ` a ritmo medio de ${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km`;
        }
        
        // Add detailed lap information if available
        let lapsText = '';
        if (activity.laps && activity.laps.length > 1) {
          lapsText = '\n    - Desglose por vueltas: ' + activity.laps.map((lap: any, index: number) => {
            const lapDistance = (lap.distance / 1000).toFixed(2);
            let lapPace = '';
            if (lap.average_speed && lap.average_speed > 0) {
              const lapPaceMinPerKm = 16.6667 / lap.average_speed;
              const lapPaceMinutes = Math.floor(lapPaceMinPerKm);
              const lapPaceSeconds = Math.round((lapPaceMinPerKm - lapPaceMinutes) * 60);
              lapPace = ` a ${lapPaceMinutes}:${lapPaceSeconds.toString().padStart(2, '0')} min/km`;
            }
            let lapHR = '';
            if (lap.average_heartrate) {
              lapHR = ` con FC ${Math.round(lap.average_heartrate)} ppm`;
            }
            return `Vuelta ${index + 1}: ${lapDistance}km${lapPace}${lapHR}`;
          }).join('; ');
        }
        
        return `- ${activity.name}, ${distance}km el ${date}${durationText ? ` en ${durationText}` : ''}${heartRateText}${paceText}${lapsText}`;
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
      const { data: latestCondition } = await supabase
        .from('daily_conditions')
        .select('effort_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      lastActivityText = latestCondition?.effort_level !== null && latestCondition?.effort_level !== undefined
        ? `En su último entrenamiento corrió ${(latestActivity.distance / 1000).toFixed(2)}km y su percepción de esfuerzo fue de ${latestCondition.effort_level} sobre 10.`
        : `En su último entrenamiento corrió ${(latestActivity.distance / 1000).toFixed(2)}km.`;
    }
    
    // Format user profile information
    let userProfileText = '';
    if (profileData) {
      const parts = [];
      if (profileData.gender) {
        parts.push(`${profileData.gender === 'male' ? 'hombre' : 'mujer'}`);
      }
      if (profileData.date_of_birth) {
        const age = Math.floor((new Date().getTime() - new Date(profileData.date_of_birth).getTime()) / 31536000000);
        parts.push(`${age} años`);
      }
      if (parts.length > 0) {
        userProfileText = `\n\nEntrenando a un atleta ${parts.join(', ')}.`;
      }
    }
    
    // Format personal best results
    let personalBestsText = '';
    if (raceResults && raceResults.length > 0) {
      personalBestsText = '\n\nMarcas personales:';
      raceResults.forEach(result => {
        const raceDate = format(new Date(result.race_date), "d 'de' MMMM 'de' yyyy", { locale: es });
        const hours = result.hours ? `${result.hours}h ` : '';
        const minutes = result.minutes ? `${result.minutes}min ` : '';
        const seconds = result.seconds ? `${result.seconds}s` : '';
        personalBestsText += `\n- ${result.distance}: ${hours}${minutes}${seconds}(${raceDate})`;
      });
      personalBestsText += '\n\nEstas marcas son históricas y no garantizan el rendimiento actual del atleta.';
    }

    return `Eres un entrenador de atletismo de alto nivel, aunque entrenas a gente de todos los ámbitos y niveles. Estás entrenando a un atleta que lleva corriendo regularmente ${onboarding.running_experience}.${userProfileText}

Suele entrenar ${onboarding.weekly_frequency.toLowerCase()} a la semana.${recentActivitiesText ? `\n\nEstos son sus últimos entrenamientos:\n${recentActivitiesText}` : ''}

${averageDistanceText ? `${averageDistanceText}\n\n` : ''}Hoy es ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}, ${
      onboarding.goal_type === "Quiero preparar una carrera lo mejor posible" 
        ? `y se está preparando para correr ${onboarding.race_distance || 'una carrera'} el ${format(new Date(onboarding.race_date || ''), "d 'de' MMMM 'de' yyyy", { locale: es })}.` 
        : 'y entrena para mantenerse en forma.'
    }

${lastActivityText ? `${lastActivityText} ` : ''}Su percepción de niveles de energía es de ${energy} sobre 4 (siendo 4 lleno de energía y 1 completamente exhausto). Se encuentra con ${conditionText}.${personalBestsText}

NOTA: Ten en cuenta que los datos de frecuencia cardíaca podrían no ser completamente precisos debido a posibles problemas con los monitores de frecuencia cardíaca.

Basado en las percepciones personales, objetivos e historial de entrenamientos, sugiere un entrenamiento para el usuario a realizar en el día de hoy. El formato en que lo aportes debe incluir un título de no más de 10 palabras explicando en qué consiste el entrenamiento, una descripción en la cual se explique de forma más detallada cómo se ha de ejecutar el entrenamiento y sensaciones que debe tener mientras lo ejecute (no recomiendes un ritmo específico de entrenamiento, la recomendación debe girar en torno a las percepciones del usuario). La descripción escríbela de forma relativamente concisa (máximo 3 párrafos cortos). Debes también incluir una sesión alternativa a realizar en caso de que no le encaje la recomendada al usuario. En caso de que el usuario ya haya entrenado en el día de hoy, no le recomiendes otro entrenamiento en la sesión principal y recomiéndaselo como alternativa, pero avísale sobre los riesgos de doblar entrenamientos en el mismo día.`;
  } catch (error) {
    console.error('Error generating prompt:', error);
    return '';
  }
};
