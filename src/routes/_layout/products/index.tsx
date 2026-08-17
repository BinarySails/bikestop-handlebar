/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  MoreVertical,
  Package,
  RotateCcw,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { CreateProductDialog } from "@/components/features/products/create-product-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function ProductsListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("all");
  const [archivedOnly, setArchivedOnly] = useState(false);

  const {
    data: res,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useListProductsRequest({
    page: page + 1,
    limit: PAGE_SIZE,
    is_archived: archivedOnly || undefined,
    status: archivedOnly ? undefined : status === "all" ? undefined : status,
    search: appliedSearch || undefined,
  });

  const products = res?.status === 200 ? res.data.data : [];
  const total = res?.status === 200 ? res.data.total : 0;
  const hasError = Boolean(error) || Boolean(res && res.status !== 200);

  function handleApplySearch() {
    setAppliedSearch(search);
    setPage(0);
  }

  function handleClearFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatus("all");
    setArchivedOnly(false);
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

  const columns: EntityColumn<Product>[] = [
    {
      header: "Estatus",
      cell: (product) => (
        <Badge variant={statusBadgeVariant[product.status]}>
          {statusLabel[product.status]}
        </Badge>
      ),
    },
    {
      header: "Nombre",
      cell: (product) => (
        <span className="font-medium">{product.display_name}</span>
      ),
    },
    {
      header: "Marca",
      cell: (product) => <span>{product.brand.display_name}</span>,
    },
    {
      header: "Categoría",
      cell: (product) => <span>{product.category.display_name}</span>,
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Acciones de ${product.display_name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <ViewProductMenuItem productId={product.id} />
            <DropdownMenuSeparator />
            <ArchiveProductMenuItem product={product} onSuccess={mutate} />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Productos"
        description="Administra el catálogo de productos y sus variantes en BikeStop."
        actions={
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
        }
      />
      <EntityIndexPage<Product>
        ariaLabel="Productos"
        cardTitle={
          <EntityCardTitle icon={Package}>
            Catálogo de productos
          </EntityCardTitle>
        }
        cardHeaderExtras={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroup className="w-full max-w-xl">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleApplySearch();
                  }
                }}
                placeholder="Buscar por nombre, marca o categoría"
                aria-label="Buscar por nombre, marca o categoría"
              />
            </InputGroup>

            <div className="flex items-center gap-2">
              {!archivedOnly && (
                <>
                  <span className="text-sm text-gray-500">Estatus</span>
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value as ListStatusFilter);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger size="sm" className="min-w-36">
                      <SelectValue>{statusFilterLabel[status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="enable">Activo</SelectItem>
                      <SelectItem value="disable">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                aria-pressed={archivedOnly}
                onClick={() => {
                  setArchivedOnly(!archivedOnly);
                  setPage(0);
                }}
              >
                <Archive />
                {archivedOnly ? "Mostrar activas" : "Mostrar archivadas"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleClearFilters}
              >
                <RotateCcw />
                Limpiar
              </Button>
            </div>
          </div>
        }
        columns={columns}
        rows={products}
        rowKey={(product) => product.id}
        loading={isLoading}
        validating={isValidating && !!res}
        hasError={hasError}
        errorMessage="Error al cargar los productos."
        onRetry={() => mutate()}
        emptyMessage="No hay productos que coincidan con los filtros."
        pagination={{
          mode: "page",
          total,
          page,
          pageSize: PAGE_SIZE,
          totalLabel: "productos",
          onPageChange: (nextPage) => setPage(nextPage),
        }}
      />
    </>
  );
}
