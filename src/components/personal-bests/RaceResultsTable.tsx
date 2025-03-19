
import React from "react";
import { Pencil, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RaceResult, formatTime, formatDate } from "./utils/pb-utils";

interface RaceResultsTableProps {
  results: RaceResult[];
  onEdit: (result: RaceResult) => void;
  onDelete: (id: string) => void;
}

const RaceResultsTable = ({ results, onEdit, onDelete }: RaceResultsTableProps) => {
  return (
    <div className="max-h-[60vh] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tiempo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{formatDate(result.race_date)}</TableCell>
              <TableCell>
                <span className="flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-gray-500" />
                  {formatTime(result.hours, result.minutes, result.seconds)}
                </span>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RaceResultsTable;
