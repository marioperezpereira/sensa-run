
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PBProfileForm from "@/components/personal-bests/PBProfileForm";
import RaceResultsList from "@/components/personal-bests/RaceResultsList";
import AddRaceResultDialog from "@/components/personal-bests/AddRaceResultDialog";
import { ChatHeader } from "@/components/ChatHeader";

const PersonalBests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshResults, setRefreshResults] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      
      // After confirming authentication, check profile
      const { data: profile } = await supabase
        .from('user_pb_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      setProfileComplete(!!profile);
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate]);

  const handleProfileSaved = () => {
    setProfileComplete(true);
  };

  const handleRaceAdded = () => {
    setShowAddDialog(false);
    setRefreshResults(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20 p-4 flex justify-center items-center">
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

  // If no user (shouldn't get here due to redirect, but just in case)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sensa-purple/20 to-sensa-lime/20">
      <ChatHeader />
      
      <div className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <Card className="shadow-md border-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-amber-500" /> 
                Personal Bests
              </CardTitle>
              
              {profileComplete && (
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-sensa-purple hover:bg-sensa-purple/90 text-white"
                  size="sm"
                >
                  <PlusCircle className="mr-1 h-4 w-4" />
                  Nueva marca
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            {!profileComplete ? (
              <PBProfileForm onProfileSaved={handleProfileSaved} />
            ) : (
              <RaceResultsList refreshTrigger={refreshResults} />
            )}
          </CardContent>
        </Card>
      </div>
      
      <AddRaceResultDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onRaceAdded={handleRaceAdded}
      />
    </div>
  );
};

export default PersonalBests;
