import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export type RatingStep = 'loading' | 'effort' | 'energy' | 'condition' | 'completed';

interface Activity {
  id: string;
  name: string;
  distance: number;
  start_date: string;
  moving_time: number;
  formattedDate?: string;
  formattedDistance?: string;
}

export const useRatingsFlow = () => {
  const [currentStep, setCurrentStep] = useState<RatingStep>('loading');
  const [activity, setActivity] = useState<Activity | null>(null);

  const syncStravaActivities = async (userId: string) => {
    try {
      const { data: athlete } = await supabase
        .from('user_onboarding')
        .select('strava_profile')
        .eq('user_id', userId)
        .single();

      if (!athlete?.strava_profile) {
        console.log('No Strava profile found, skipping sync');
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingRec } = await supabase
        .from('training_recommendations')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .maybeSingle();

      if (existingRec) {
        console.log('Already have recommendation for today, skipping Strava sync');
        return false;
      }

      console.log('Fetching latest Strava activities...');
      const { data: stravaData, error: stravaError } = await supabase.functions.invoke(
        'fetch-strava-activities',
        {
          body: { user_id: userId }
        }
      );

      if (stravaError) {
        console.error('Error fetching Strava activities:', stravaError);
        return false;
      }

      if (stravaData?.activities && Array.isArray(stravaData.activities)) {
        const activitiesToUpsert = stravaData.activities.map(activity => ({
          user_id: userId,
          strava_id: activity.id,
          name: activity.name,
          type: activity.type,
          start_date: activity.start_date,
          distance: activity.distance,
          moving_time: activity.moving_time || 0
        }));

        const { error: upsertError } = await supabase
          .from('strava_activities')
          .upsert(activitiesToUpsert, { 
            onConflict: 'strava_id'
          });

        if (upsertError) {
          console.error('Error upserting activities:', upsertError);
          return false;
        }
      }

      console.log('Strava sync completed successfully');
      return true;
    } catch (error) {
      console.error('Error in syncStravaActivities:', error);
      return false;
    }
  };

  const checkLatestActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentStep('completed');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingRec } = await supabase
        .from('training_recommendations')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .maybeSingle();

      if (existingRec) {
        console.log('Already have recommendation, skipping activity check');
        setCurrentStep('completed');
        return;
      }

      await syncStravaActivities(user.id);

      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data: activities, error: activitiesError } = await supabase
        .from('strava_activities')
        .select('*')
        .gte('start_date', sevenDaysAgo.toISOString())
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);

      if (activitiesError) throw activitiesError;

      if (!activities || activities.length === 0) {
        console.log('No recent activities found, moving to energy rating');
        setCurrentStep('energy');
        return;
      }

      console.log('Found activity to rate:', activities[0]);
      setActivity(activities[0]);
      setCurrentStep('effort');
    } catch (error) {
      console.error('Error in checkLatestActivity:', error);
      setCurrentStep('energy');
    }
  };

  useEffect(() => {
    checkLatestActivity();
  }, []);

  const moveToNextStep = () => {
    switch (currentStep) {
      case 'effort':
        setCurrentStep('energy');
        break;
      case 'energy':
        setCurrentStep('condition');
        break;
      case 'condition':
        setCurrentStep('completed');
        break;
      default:
        break;
    }
  };

  const formatActivity = () => {
    if (!activity) return null;
    const date = format(new Date(activity.start_date), "d 'de' MMMM", { locale: es });
    const distance = (activity.distance / 1000).toFixed(2);
    return {
      ...activity,
      formattedDate: date,
      formattedDistance: distance
    };
  };

  return {
    currentStep,
    activity: activity ? formatActivity() : null,
    moveToNextStep,
    reset: () => {
      setCurrentStep('loading');
      setActivity(null);
      checkLatestActivity();
    }
  };
};
