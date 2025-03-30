
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RaceResult } from "@/components/personal-bests/race-results/types";
import { calculateIAAFPoints } from "@/lib/iaaf"; // Updated import
import { Enums } from "@/integrations/supabase/types";

type PBRaceDistance = Enums<"pb_race_distance">;

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
      
      // Fetch results based on distance
      let query = supabase
        .from('race_results')
        .select('*')
        .eq('distance', distance)
        .order('race_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setResults(data || []);
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

  const getIAAFPoints = (result: RaceResult) => {
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

  useEffect(() => {
    fetchResults();
  }, [distance, refreshTrigger]);

  return {
    loading,
    results,
    gender,
    deleteResult,
    updateResultInState,
    getIAAFPoints
  };
};
