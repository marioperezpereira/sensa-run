
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
}

export const useRatingsFlow = () => {
  const [currentStep, setCurrentStep] = useState<RatingStep>('loading');
  const [activity, setActivity] = useState<Activity | null>(null);

  const syncStravaActivities = async (userId: string) => {
    try {
      console.log('Syncing latest Strava activities...');
      const { data: athlete } = await supabase
        .from('user_onboarding')
        .select('strava_profile')
        .eq('user_id', userId)
        .single();

      if (!athlete?.strava_profile) {
        console.log('No Strava profile found, skipping sync');
        return false;
      }

      // Fetch latest activities through our edge function
      console.log('Fetching activities for user:', userId);
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

      // Store fetched activities in our database
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

      // First sync latest activities from Strava
      await syncStravaActivities(user.id);

      const sevenDaysAgo = subDays(new Date(), 7);
      
      // Check if we have any recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('strava_activities')
        .select('*')
        .gte('start_date', sevenDaysAgo.toISOString())
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);

      if (activitiesError) throw activitiesError;

      if (!activities || activities.length === 0) {
        // If no Strava activities, skip effort rating and go straight to energy
        console.log('No recent activities found, moving to energy rating');
        setCurrentStep('energy');
        return;
      }

      console.log('Found activity to rate:', activities[0]);
      setActivity(activities[0]);
      setCurrentStep('effort');
    } catch (error) {
      console.error('Error in checkLatestActivity:', error);
      // On error, still continue with the flow starting at energy
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
    activity: formatActivity(),
    moveToNextStep,
    reset: () => {
      setCurrentStep('loading');
      setActivity(null);
      checkLatestActivity();
    }
  };
};
