
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

// Updated schema to only allow Male or Female
const formSchema = z.object({
  gender: z.enum(["Male", "Female"], {
    required_error: "Debes seleccionar el género",
  }),
  dateOfBirth: z.date({
    required_error: "Debes seleccionar la fecha de nacimiento",
  }),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface PBProfileFormProps {
  onProfileSaved: () => void;
}

const PBProfileForm = ({ onProfileSaved }: PBProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear() - 30);
  const [month, setMonth] = useState(new Date().getMonth());
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase.from('user_pb_profiles').insert({
        user_id: user.id,
        gender: values.gender,
        date_of_birth: format(values.dateOfBirth, 'yyyy-MM-dd'),
      });
      
      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el perfil",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Perfil guardado",
        description: "Tu perfil ha sido guardado correctamente",
      });
      
      onProfileSaved();
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar tus datos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom date picker component with year navigation
  const CustomDatePicker = ({ value, onChange }: { value?: Date, onChange: (date: Date) => void }) => {
    const [currentYear, setCurrentYear] = useState(value?.getFullYear() || new Date().getFullYear() - 30);
    const [currentMonth, setCurrentMonth] = useState(value?.getMonth() || new Date().getMonth());
    
    // Generate days for the current month/year
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const previousMonthDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
    
    const prevMonthDays = Array.from({ length: previousMonthDays }, (_, i) => daysInPreviousMonth - previousMonthDays + i + 1);
    
    const monthNames = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), 'MMMM', { locale: es }));
    
    const handlePrevYear = () => setCurrentYear(currentYear - 1);
    const handleNextYear = () => setCurrentYear(currentYear + 1);
    const handlePrevYears = () => setCurrentYear(currentYear - 10);
    const handleNextYears = () => setCurrentYear(currentYear + 10);
    const handlePrevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    };
    const handleNextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };
    
    const handleDateSelect = (day: number) => {
      const selectedDate = new Date(currentYear, currentMonth, day);
      onChange(selectedDate);
    };
    
    const today = new Date();
    const isDateSelected = (day: number) => {
      return value && 
        value.getDate() === day && 
        value.getMonth() === currentMonth && 
        value.getFullYear() === currentYear;
    };
    
    const isDateInRange = (day: number) => {
      const date = new Date(currentYear, currentMonth, day);
      return date <= today && date >= new Date("1900-01-01");
    };
    
    return (
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handlePrevYears} className="h-7 w-7 p-0">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrevYear} className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 text-sm font-medium">{currentYear}</span>
            <Button variant="ghost" size="icon" onClick={handleNextYear} className="h-7 w-7 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextYears} className="h-7 w-7 p-0">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{monthNames[currentMonth]}</span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="h-8 w-8 flex items-center justify-center">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {prevMonthDays.map((day) => (
            <div 
              key={`prev-${day}`} 
              className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground opacity-50"
            >
              {day}
            </div>
          ))}
          
          {days.map((day) => (
            <Button
              key={day}
              variant={isDateSelected(day) ? "default" : "ghost"}
              size="icon"
              className={`h-8 w-8 p-0 text-xs ${!isDateInRange(day) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isDateInRange(day)}
              onClick={() => isDateInRange(day) && handleDateSelect(day)}
            >
              {day}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-medium">Información de perfil</h2>
        <p className="text-sm text-gray-500">
          Para calcular los puntos IAAF equivalentes de tus marcas necesitamos algunos datos adicionales.
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Masculino</SelectItem>
                    <SelectItem value="Female">Femenino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de nacimiento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value && "text-muted-foreground"
                        }`}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CustomDatePicker 
                      value={field.value} 
                      onChange={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-sensa-purple hover:bg-sensa-purple/90 text-white" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar información"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PBProfileForm;
