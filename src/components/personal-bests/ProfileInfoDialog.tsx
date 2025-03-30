
import { useState, useEffect } from "react";
import { differenceInYears } from "date-fns";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PBProfileForm from "./PBProfileForm";

interface ProfileInfoDialogProps {
  onProfileUpdated: () => void;
}

const ProfileInfoDialog = ({ onProfileUpdated }: ProfileInfoDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_pb_profiles')
        .select('gender, date_of_birth')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setGender(profile.gender === 'Male' ? 'Hombre' : 'Mujer');
        
        if (profile.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth);
          const currentAge = differenceInYears(new Date(), birthDate);
          setAge(currentAge);
        }
      }
    };

    fetchProfileData();
  }, []);

  const handleProfileSaved = () => {
    setShowForm(false);
    onProfileUpdated();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Calculamos las puntuaciones de tus carreras en base a los datos de tu perfil ({gender}, {age} años)
            </p>
            <button 
              onClick={() => setIsOpen(true)}
              className="text-sensa-purple hover:text-sensa-purple/80 flex items-center text-sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar mis datos
            </button>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datos de perfil</DialogTitle>
          <DialogDescription>
            Estos datos son utilizados para puntuar tus carreras
          </DialogDescription>
        </DialogHeader>
        
        {showForm ? (
          <PBProfileForm onProfileSaved={handleProfileSaved} />
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Género</h3>
              <p>{gender}</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Edad</h3>
              <p>{age} años</p>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white rounded-full py-2"
            >
              Editar datos
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileInfoDialog;
