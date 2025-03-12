
import { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatHeader } from "@/components/ChatHeader";
import { OnboardingQuestion } from "@/components/OnboardingQuestion";
import { RatingFlow } from "@/components/RatingFlow";
import { Landing } from "@/components/Landing";

const Index = () => {
  const [session, setSession] = useState<boolean | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: onboardingData, isLoading: isOnboardingLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching onboarding data:', error);
        return null;
      }
      return data;
    },
    enabled: session !== null && session !== false,
  });

  if (session === false) {
    return <Landing />;
  }

  if (isOnboardingLoading || session === null) {
    return (
      <div className="h-screen grid place-items-center bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/lovable-uploads/e9de7ab0-2520-438e-9d6f-5ea0ec576fac.png" 
            alt="Sensa" 
            className="h-16 w-16 animate-pulse"
          />
          <p className="text-sensa-purple font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20">
      {onboardingData && <ChatHeader />}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {!onboardingData ? (
          <OnboardingQuestion onComplete={() => window.location.reload()} />
        ) : (
          <RatingFlow key="rating-flow" />
        )}
      </div>
    </div>
  );
};

export default Index;
