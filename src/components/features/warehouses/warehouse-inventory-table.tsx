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
import type { Product, WarehouseResponse } from "@/lib/api/schemas";

export type WarehouseInventoryItem = {
  sku: string;
  nombre: string;
  imagen: string;
  cantidad: number;
};

type WarehouseInventoryTableProps = {
  warehouse: WarehouseResponse;
  products: Product[];
  warehouses: WarehouseResponse[];
  items: WarehouseInventoryItem[];
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

export function WarehouseInventoryTable({
  warehouse,
  products,
  warehouses,
  items,
  loading,
  error,
  onRetry,
  onAddSuccess,
}: WarehouseInventoryTableProps) {
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
          Inventario en {warehouse.name}
        </CardTitle>
        <CreateInventoryTransactionDialog
          products={products}
          warehouses={warehouses}
          onSuccess={onAddSuccess}
        />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay inventario registrado en este almacén.
          </p>
        ) : (
          <Table aria-label="Listado de inventario por almacén">
            <TableHeader>
              <TableRow>
                <TableHead>Nombre variante</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`${item.sku}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="size-10 rounded-md object-cover"
                      />
                      <span>{item.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
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
