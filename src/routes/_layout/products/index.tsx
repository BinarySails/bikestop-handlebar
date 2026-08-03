import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CreateProductDialog } from "@/components/features/products/create-product-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { ProductListItem } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/products/")({
  component: ProductsListPage,
});

const PAGE_SIZE = 10;

const statusBadgeVariant: Record<
  ProductListItem["status"],
  "default" | "secondary" | "destructive"
> = {
  enable: "default",
  disable: "secondary",
  archive: "destructive",
};

const statusLabel: Record<ProductListItem["status"], string> = {
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

type Filters = {
  productName: string;
  status: "all" | ProductListItem["status"];
  brand: string;
  category: string;
};

const EMPTY_FILTERS: Filters = {
  productName: "",
  status: "all",
  brand: "",
  category: "",
};

function matchesFilters(product: ProductListItem, filters: Filters): boolean {
  if (
    filters.productName &&
    !product.display_name
      .toLowerCase()
      .includes(filters.productName.toLowerCase())
  ) {
    return false;
  }
  if (filters.status !== "all" && product.status !== filters.status) {
    return false;
  }
  if (
    filters.brand &&
    !product.brand_name.toLowerCase().includes(filters.brand.toLowerCase())
  ) {
    return false;
  }
  if (
    filters.category &&
    !product.category_name
      .toLowerCase()
      .includes(filters.category.toLowerCase())
  ) {
    return false;
  }
  return true;
}

function ProductsListPage() {
  const [page, setPage] = useState(0);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);

  const {
    data: res,
    error,
    isLoading,
    mutate,
  } = useListProductsRequest({
    page: page + 1,
    limit: PAGE_SIZE,
    status: appliedFilters.status === "all" ? undefined : appliedFilters.status,
    search: appliedFilters.productName || undefined,
  });

  const products = useMemo<ProductListItem[]>(
    () => (res?.status === 200 ? res.data.data : []),
    [res]
  );
  const total = res?.status === 200 ? res.data.total : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesFilters(p, appliedFilters)),
    [products, appliedFilters]
  );

  function handleApplyFilters() {
    setAppliedFilters(draftFilters);
    setPage(0);
  }

  function handleClearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(0);
  }

  return (
    <section
      aria-label="Productos"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        </div>
        <CreateProductDialog onSuccess={mutate} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">Producto</Label>
            <Input
              id="product-name"
              placeholder="Buscar por nombre"
              value={draftFilters.productName}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, productName: e.target.value }))
              }
              className="w-56"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Estatus</Label>
            <Select
              value={draftFilters.status}
              onValueChange={(value) =>
                setDraftFilters((f) => ({
                  ...f,
                  status: value as Filters["status"],
                }))
              }
            >
              <SelectTrigger id="status" className="w-44">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enable">Activo</SelectItem>
                <SelectItem value="disable">Inactivo</SelectItem>
                <SelectItem value="archive">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              placeholder="Buscar por marca"
              value={draftFilters.brand}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, brand: e.target.value }))
              }
              className="w-48"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              placeholder="Buscar por categoría"
              value={draftFilters.category}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, category: e.target.value }))
              }
              className="w-48"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button className="h-8" size="sm" onClick={handleApplyFilters}>
              Aplicar
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">&nbsp;</span>
            <Button
              className="h-8"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {isLoading ? (
            <ProductsListSkeleton />
          ) : error ? (
            <p className="text-sm text-muted-foreground">
              Error al cargar los productos.
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay productos que coincidan con los filtros.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[product.status]}>
                          {statusLabel[product.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.display_name}
                      </TableCell>
                      <TableCell>{product.brand_name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
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
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
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
