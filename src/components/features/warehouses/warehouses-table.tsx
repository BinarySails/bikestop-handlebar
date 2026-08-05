import { Link } from "@tanstack/react-router";
import { Eye, MapPin, MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WarehouseResponse } from "@/lib/api/schemas";

type WarehouseStatus = WarehouseResponse["status"];

const statusBadgeVariant: Record<WarehouseStatus, "default" | "secondary"> = {
  active: "default",
  inactive: "secondary",
};

const statusLabel: Record<WarehouseStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
};

type WarehousesTableProps = {
  warehouses: WarehouseResponse[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Cargando almacenes">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function WarehousesTable({
  warehouses,
  loading,
  error,
  onRetry,
}: WarehousesTableProps) {
  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div role="alert" className="space-y-3 py-10 text-center">
        <p className="font-medium">No se pudieron cargar los almacenes.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No hay almacenes que coincidan con los filtros.
      </p>
    );
  }

  return (
    <Table aria-label="Listado de almacenes">
      <TableHeader>
        <TableRow>
          <TableHead>Estatus</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Ciudad</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {warehouses.map((warehouse) => (
          <TableRow key={warehouse.id}>
            <TableCell>
              <Badge variant={statusBadgeVariant[warehouse.status]}>
                {statusLabel[warehouse.status]}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{warehouse.name}</TableCell>
            <TableCell>
              <span className="font-mono text-sm">{warehouse.code ?? "—"}</span>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" />
                {warehouse.address.city}
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Acciones de ${warehouse.name}`}
                    />
                  }
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    render={
                      <Link
                        to="/warehouses/$warehouseId"
                        params={{ warehouseId: warehouse.id }}
                      />
                    }
                  >
                    <Eye /> Ver detalle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
