import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RaceResult } from "@/components/personal-bests/race-results/types";
import { getIAAFPoints } from "@/lib/iaaf/utils";
import { getDbDistance } from "@/lib/utils";

export const useRaceResults = (distance: string, refreshTrigger = 0) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [gender, setGender] = useState<'men' | 'women'>('men');
  const { toast } = useToast();

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
      
      // Convert display distance to database format
      const dbDistance = getDbDistance(distance);
      
      // Fetch results based on distance AND user_id
      let query = supabase
        .from('race_results')
        .select('*')
        .eq('distance', dbDistance) // Filter by correctly formatted distance
        .eq('user_id', user.id)     // Filter by user_id
        .order('race_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to RaceResult type
      const typedResults: RaceResult[] = data?.map(result => ({
        id: result.id,
        race_date: result.race_date,
        distance: result.distance,
        hours: result.hours,
        minutes: result.minutes,
        seconds: result.seconds,
        surface_type: result.surface_type as RaceResult['surface_type'],
        track_type: result.track_type as RaceResult['track_type']
      })) || [];
      
      setResults(typedResults);
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

  const deleteResult = async (id: string) => {
    try {
      const { error } = await supabase
        .from('race_results')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Resultado eliminado",
        description: "El resultado ha sido eliminado correctamente",
      });
      
      // Remove the deleted result from state
      setResults(results.filter(r => r.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting race result:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el resultado",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateResultInState = (updatedResult: RaceResult) => {
    setResults(results.map(r => r.id === updatedResult.id ? updatedResult : r));
  };

  const calculatePoints = (result: RaceResult) => {
    return getIAAFPoints(result, gender);
  };

  useEffect(() => {
    fetchResults();
  }, [distance, refreshTrigger]);

  return {
    loading,
    results,
    gender,
    deleteResult,
    updateResultInState,
    getIAAFPoints: calculatePoints
  };
};
