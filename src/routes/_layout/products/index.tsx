import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";

import { CreateProductDialog } from "@/components/features/products/create-product-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useListProductsRequest, useUpdateProductRequest } from "@/lib/api/api";
import type { Product } from "@/lib/api/schemas";

export const Route = createFileRoute("/_layout/products/")({
  component: ProductsListPage,
});

const PAGE_SIZE = 10;

type ListStatusFilter = "all" | "enable" | "disable";

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

const statusFilterLabel: Record<ListStatusFilter, string> = {
  all: "Todos",
  enable: "Activo",
  disable: "Inactivo",
};

function ViewProductMenuItem({ productId }: { productId: string }) {
  const navigate = useNavigate();

  return (
    <DropdownMenuItem
      onClick={() =>
        navigate({ to: "/products/$productId", params: { productId } })
      }
    >
      <span>Ver</span>
    </DropdownMenuItem>
  );
}

function ArchiveProductMenuItem({
  product,
  onSuccess,
}: {
  product: Product;
  onSuccess?: () => Promise<unknown>;
}) {
  const { trigger: updateProduct } = useUpdateProductRequest(product.id);
  const [pending, setPending] = useState(false);

  async function handleArchive() {
    setPending(true);
    try {
      const result = await updateProduct({
        display_name: product.display_name,
        brand_id: product.brand.id,
        category_id: product.category.id,
        description: product.description ?? null,
        status: "archive",
      });

      if (result.status === 200) {
        toast.success(`Producto "${product.display_name}" archivado.`);
        await onSuccess?.();
      } else {
        toast.error("No se pudo archivar el producto.");
      }
    } catch {
      toast.error("No se pudo archivar el producto.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenuItem
      variant="destructive"
      onClick={handleArchive}
      disabled={pending || product.status === "archive"}
    >
      <span>Eliminar</span>
    </DropdownMenuItem>
  );
}

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
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("all");

  const {
    data: res,
    error,
    isLoading,
    mutate,
  } = useListProductsRequest({
    page: page + 1,
    limit: PAGE_SIZE,
    status: status === "all" ? undefined : status,
    search: appliedSearch || undefined,
  });

  const products = res?.status === 200 ? res.data.data : [];
  const total = res?.status === 200 ? res.data.total : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  function handleApplySearch() {
    setAppliedSearch(search);
    setPage(0);
  }

  function handleClearFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatus("all");
    setPage(0);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== appliedSearch) {
        setAppliedSearch(search);
        setPage(0);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, appliedSearch]);

  return (
    <section
      aria-label="Productos"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            render={<Link to="/categories" />}
            variant="outline"
            size="sm"
          >
            Administrar Categorías
          </Button>
          <CreateProductDialog onSuccess={mutate} />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search">Búsqueda</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nombre, marca o categoría"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApplySearch();
                  }
                }}
                className="w-72 pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Estatus</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as ListStatusFilter);
                setPage(0);
              }}
            >
              <SelectTrigger id="status" className="w-44">
                <SelectValue
                  placeholder="Seleccionar"
                  render={() => <span>{statusFilterLabel[status]}</span>}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enable">Activo</SelectItem>
                <SelectItem value="disable">Inactivo</SelectItem>
              </SelectContent>
            </Select>
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
          ) : products.length === 0 ? (
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
                    <TableHead>Categoría</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[product.status]}>
                          {statusLabel[product.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.display_name}
                      </TableCell>
                      <TableCell>{product.brand.display_name}</TableCell>
                      <TableCell>{product.category.display_name}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Acciones de ${product.display_name}`}
                                className="size-8"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <ViewProductMenuItem productId={product.id} />
                            <DropdownMenuSeparator />
                            <ArchiveProductMenuItem
                              product={product}
                              onSuccess={mutate}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
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
