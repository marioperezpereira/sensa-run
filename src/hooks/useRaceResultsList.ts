
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RaceResult, SurfaceType, TrackType } from "@/components/personal-bests/race-results/types";
import { calculateIAAFPoints } from "@/lib/iaaf";

interface ResultsByDistance {
  distance: string;
  pb: RaceResult | null;
  latest: RaceResult | null;
  count: number;
  surfaceType: string;
  trackType?: string;
}

// Helper function to convert database enum to display format
const formatDistanceForDisplay = (distance: string): string => {
  if (distance === "5K" || distance === "10K") return distance;
  if (distance === "Half Marathon") return "Media maratón";
  if (distance === "Marathon") return "Maratón";
  return distance; // Return as is for track distances
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
        
        // Get race results, filtering by user_id
        const { data: results, error } = await supabase
          .from('race_results')
          .select('*')
          .eq('user_id', user.id) // Add filter by user_id
          .order('race_date', { ascending: false });

        if (error) throw error;

        // Group results by distance and track type
        const resultsMap = new Map<string, RaceResult[]>();
        
        (results || []).forEach(result => {
          // Create a unique key for each distance + surface + track type combination
          const surfaceType = result.surface_type || "Asfalto";
          const trackType = result.track_type || "";
          const key = `${result.distance}|${surfaceType}|${trackType}`;
          
          if (!resultsMap.has(key)) {
            resultsMap.set(key, []);
          }
          
          const typedResult: RaceResult = {
            id: result.id,
            race_date: result.race_date,
            distance: result.distance,
            hours: result.hours,
            minutes: result.minutes,
            seconds: result.seconds,
            surface_type: result.surface_type as SurfaceType,
            track_type: result.track_type as TrackType
          };
          
          resultsMap.get(key)?.push(typedResult);
        });
        
        // Process grouped results
        const groupedResults: ResultsByDistance[] = [];
        
        resultsMap.forEach((distanceResults, key) => {
          const [distance, surfaceType, trackType] = key.split('|');
          
          // Find PB (fastest time)
          const pb = [...distanceResults].sort((a, b) => {
            const aTime = a.hours * 3600 + a.minutes * 60 + a.seconds;
            const bTime = b.hours * 3600 + b.minutes * 60 + b.seconds;
            return aTime - bTime;
          })[0] || null;
          
          // Latest is already first since we ordered by date
          const latest = distanceResults[0] || null;
          
          groupedResults.push({
            distance: formatDistanceForDisplay(distance),
            surfaceType,
            trackType: trackType || undefined,
            pb,
            latest,
            count: distanceResults.length
          });
        });
        
        // Sort results: first by surface type (Asfalto first), then by trackType, then by distance
        groupedResults.sort((a, b) => {
          // Sort by surface type (Asfalto first)
          if (a.surfaceType !== b.surfaceType) {
            return a.surfaceType === "Asfalto" ? -1 : 1;
          }
          
          // Sort by track type
          if (a.trackType !== b.trackType) {
            if (!a.trackType) return -1;
            if (!b.trackType) return 1;
            return a.trackType === "Aire Libre" ? -1 : 1;
          }
          
          // Sort by distance (shortest to longest)
          const aDist = a.distance;
          const bDist = b.distance;
          
          // Check for numerical prefixes
          const aMatch = aDist.match(/^(\d+)/);
          const bMatch = bDist.match(/^(\d+)/);
          
          if (aMatch && bMatch) {
            return parseInt(aMatch[1]) - parseInt(bMatch[1]);
          }
          
          // Sort road races
          const roadOrder = ["5K", "10K", "Media maratón", "Maratón"];
          const aIndex = roadOrder.indexOf(aDist);
          const bIndex = roadOrder.indexOf(bDist);
          
          if (aIndex >= 0 && bIndex >= 0) {
            return aIndex - bIndex;
          }
          
          // Sort alphabetically as fallback
          return aDist.localeCompare(bDist);
        });
        
        setResultsByDistance(groupedResults);
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
    try {
      if (!result) return 0;
      
      // Determine if it's an indoor event
      const isIndoor = result.track_type === "Pista Cubierta";
      
      return calculateIAAFPoints(
        result.distance, 
        result.hours, 
        result.minutes, 
        result.seconds, 
        gender,
        isIndoor
      );
    } catch (error) {
      console.error('Error calculating IAAF points:', error);
      return 0;
    }
  };

  return {
    loading,
    resultsByDistance,
    getIAAFPoints
  };
};
