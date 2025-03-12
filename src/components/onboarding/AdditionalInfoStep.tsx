
import { Input } from "@/components/ui/input";

interface AdditionalInfoStepProps {
  value: string;
  onChange: (value: string) => void;
}

export const AdditionalInfoStep = ({ value, onChange }: AdditionalInfoStepProps) => {
  return (
    <div className="space-y-4">
      <p className="text-gray-800 text-sm md:text-base">
        ¿Hay algo más que consideres que debo saber? Por ejemplo lesiones recientes, 
        problemas de salud, tus mejores marcas en carreras…
      </p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe aquí cualquier información adicional..."
        className="min-h-[100px]"
      />
    </div>
  );
};
