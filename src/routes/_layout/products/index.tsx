import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";

import { CreateProductDialog } from "@/components/features/products/create-product-modal";
import { Badge } from "@/components/ui/badge";
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
import { useListProductsRequest } from "@/lib/api/api";
import type { Product } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/products/")({
  component: ProductsListPage,
});

const PAGE_SIZE = 10;

const statusBadgeVariant: Record<
  Product["status"],
  "default" | "secondary" | "destructive"
> = {
  enable: "default",
  disable: "secondary",
  archive: "destructive",
};

const statusLabel: Record<Product["status"], string> = {
  enable: "Activo",
  disable: "Inactivo",
  archive: "Archivado",
};

function ProductsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function ProductsListPage() {
  const [page, setPage] = useState(0);
  const { data: res, error, isLoading, mutate } = useListProductsRequest({
    page: page + 1,
    limit: PAGE_SIZE,
  });

  const products: Product[] = res?.status === 200 ? res.data.data : [];
  const total = res?.status === 200 ? res.data.total : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <section
      aria-label="Productos"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los productos disponibles en BikeStop.
          </p>
        </div>
        <CreateProductDialog onSuccess={mutate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Package className="size-4" />
            Productos registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProductsListSkeleton />
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              Error al cargar los productos.
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay productos registrados.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.display_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.brand_id}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.category_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[product.status]}>
                          {statusLabel[product.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
