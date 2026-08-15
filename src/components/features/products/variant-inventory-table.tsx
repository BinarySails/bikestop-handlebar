import { Package } from "lucide-react";

import { CreateInventoryTransactionDialog } from "@/components/features/products/create-inventory-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export type VariantInventoryItem = {
  almacen: string;
  cantidad: number;
};

type VariantInventoryTableProps = {
  variantId: string;
  warehouses: WarehouseResponse[];
  items: VariantInventoryItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddSuccess?: () => Promise<unknown> | void;
};

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Cargando inventario">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function VariantInventoryTable({
  variantId,
  warehouses,
  items,
  loading,
  error,
  onRetry,
  onAddSuccess,
}: VariantInventoryTableProps) {
  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div role="alert" className="space-y-3 py-10 text-center">
        <p className="font-medium">No se pudo cargar el inventario.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Package className="size-4" />
          Inventario
        </CardTitle>
        <CreateInventoryTransactionDialog
          preselectedVariantId={variantId}
          warehouses={warehouses}
          onSuccess={onAddSuccess}
        />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay inventario registrado para esta variante.
          </p>
        ) : (
          <Table aria-label="Listado de inventario por variante">
            <TableHeader>
              <TableRow>
                <TableHead>Almacén</TableHead>
                <TableHead>Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`${item.almacen}-${index}`}>
                  <TableCell className="font-medium">{item.almacen}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
