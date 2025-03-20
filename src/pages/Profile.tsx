
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProfileHeader from "@/components/profile/ProfileHeader";
import UserInfo from "@/components/profile/UserInfo";
import StravaSection from "@/components/profile/StravaSection";
import ProfileActions from "@/components/profile/ProfileActions";

const Profile = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get onboarding data
  const { data: onboardingData, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ['onboarding', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return null;
      const { data } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userData.id)
        .single();
      return data;
    },
    enabled: !!userData?.id,
  });

  const handleResetOnboarding = async () => {
    try {
      if (!userData?.id) {
        toast({
          title: "Error",
          description: "Usuario no encontrado",
          variant: "destructive"
        });
        return;
      }
      const { error } = await supabase.from('user_onboarding').delete().match({
        user_id: userData.id
      });
      if (error) {
        console.error('Error deleting onboarding:', error);
        throw error;
      }
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({
        queryKey: ['onboarding']
      });
      window.location.href = '/app';
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo reiniciar la configuración. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const isLoading = isLoadingUser || isLoadingOnboarding;

  return <div className="min-h-screen bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm space-y-6">
          <ProfileHeader />
          
          {isLoading ? (
            <div className="py-4 text-center text-gray-500">Cargando información...</div>
          ) : (
            <>
              <UserInfo user={userData} onboardingData={onboardingData} />
              <StravaSection onboardingData={onboardingData} />
              <ProfileActions userId={userData?.id} onResetClick={() => setShowConfirmDialog(true)} />
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quieres personalizar de nuevo tu experiencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto borrará tu configuración
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-red-600 text-white hover:bg-red-700 rounded-md py-0 px-[31px] mx-[11px]">
              No
            </AlertDialogCancel>
            <Button onClick={handleResetOnboarding} className="bg-green-600 hover:bg-green-700 rounded-md px-[32px] my-0 py-[10px] mx-[2px]">
              Sí
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};

export default Profile;
