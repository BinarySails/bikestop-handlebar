import { Package } from "lucide-react";

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

export type ProductInventoryItem = {
  sku: string;
  nombre: string;
  almacen: string;
  cantidad: number;
};

type ProductInventoryTableProps = {
  items: ProductInventoryItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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

export function ProductInventoryTable({
  items,
  loading,
  error,
  onRetry,
}: ProductInventoryTableProps) {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Package className="size-4" />
          Inventario
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay inventario registrado.
          </p>
        ) : (
          <Table aria-label="Listado de inventario por variante">
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead>Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={`${item.sku}-${item.almacen}-${index}`}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.nombre}</TableCell>
                  <TableCell>{item.almacen}</TableCell>
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
