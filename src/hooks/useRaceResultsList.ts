import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RaceResult } from "@/components/personal-bests/race-results/types";
import { calculateIAAFPoints } from "@/lib/iaaf";

interface ResultsByDistance {
  distance: string;
  pb: RaceResult | null;
  latest: RaceResult | null;
  count: number;
}

// Helper function to convert database enum to display format
const formatDistanceForDisplay = (distance: string): string => {
  if (distance === "5K" || distance === "10K") return distance;
  if (distance === "Half Marathon") return "Media maratón";
  if (distance === "Marathon") return "Maratón";
  return distance; // Fallback
};

export const useRaceResultsList = (refreshTrigger: number = 0) => {
  const [loading, setLoading] = useState(true);
  const [resultsByDistance, setResultsByDistance] = useState<ResultsByDistance[]>([]);
  const [gender, setGender] = useState<'men' | 'women'>('men');
  const { toast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // First get the user's profile to determine gender
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        const { data: profile } = await supabase
          .from('user_pb_profiles')
          .select('gender')
          .eq('user_id', user.id)
          .single();
          
        // Set gender for IAAF point calculation
        if (profile?.gender) {
          setGender(profile.gender.toLowerCase() === 'female' ? 'women' : 'men');
        }
        
        // Get race results
        const { data: results, error } = await supabase
          .from('race_results')
          .select('*')
          .order('race_date', { ascending: false });

        if (error) throw error;

        // Group by distance
        const distances = Array.from(new Set(results.map(r => formatDistanceForDisplay(r.distance))));
        
        const grouped = distances.map(displayDistance => {
          // Filter results for this display distance by matching with the DB enum value
          const distanceResults = results.filter(r => formatDistanceForDisplay(r.distance) === displayDistance);
          
          // Find PB (fastest time)
          const pb = [...distanceResults].sort((a, b) => {
            const aTime = a.hours * 3600 + a.minutes * 60 + a.seconds;
            const bTime = b.hours * 3600 + b.minutes * 60 + b.seconds;
            return aTime - bTime;
          })[0] || null;
          
          // Latest is already first since we ordered by date
          const latest = distanceResults[0] || null;
          
          return {
            distance: displayDistance,
            pb,
            latest,
            count: distanceResults.length
          };
        });
        
        setResultsByDistance(grouped);
      } catch (error) {
        console.error('Error fetching race results:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los resultados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast, refreshTrigger]);
  
  const getIAAFPoints = (result: RaceResult | null) => {
    if (!result) return 0;
    
    const origDistance = result.distance; // Convert from display format back to DB enum
    return calculateIAAFPoints(
      origDistance, 
      result.hours, 
      result.minutes, 
      result.seconds, 
      gender
    );
  };

  return {
    loading,
    resultsByDistance,
    getIAAFPoints
  };
};
