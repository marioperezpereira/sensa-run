
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Clock, Award } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RaceResult } from "./types";

interface ResultsTableProps {
  results: RaceResult[];
  onEdit: (result: RaceResult) => void;
  onDelete: (id: string) => void;
  gender: 'men' | 'women';
  getIAAFPoints: (result: RaceResult) => number;
}

const ResultsTable = ({ 
  results, 
  onEdit, 
  onDelete,
  gender,
  getIAAFPoints 
}: ResultsTableProps) => {
  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: es });
  };

  return (
    <div className="max-h-[60vh] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tiempo</TableHead>
            <TableHead>Puntos IAAF</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                No hay resultados para mostrar en esta página
              </TableCell>
            </TableRow>
          ) : (
            results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{formatDate(result.race_date)}</TableCell>
                <TableCell>
                  <span className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-gray-500" />
                    {formatTime(result.hours, result.minutes, result.seconds)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center bg-amber-100 text-amber-800 font-medium px-2 py-1 rounded-full text-xs w-fit">
                    <Award className="mr-1 h-3 w-3" />
                    {getIAAFPoints(result)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(result)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(result.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
