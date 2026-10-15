/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreVertical, Package, RotateCcw, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/features/layout/site-header";
import {
  EntityFilterBar,
  type FilterDefinition,
} from "@/components/features/entity/entity-filter-bar";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { CreateProductDialog } from "@/components/features/products/create-product-modal";
import { ProductThumbnail } from "@/components/features/products/product-thumbnail";
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
import {
  getVariantBySkuRequest,
  useListProductsRequest,
  useUpdateProductRequest,
} from "@/lib/api/api";
import type { Product } from "@/lib/api/schemas";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { Can } from "@/components/features/entity/can";
import { requirePolicy } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/admin/products/")({
  beforeLoad: async ({ location }) => {
    await requirePolicy(PERMISSIONS.productView, {
      from: location.href,
      navigateTo: "/login",
    });
  },
  component: ProductsListPage,
});

const PAGE_SIZE = 10;

type ListStatusFilter = "all" | "enable" | "disable" | "archive";

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
  archive: "Archivado",
};

type PromotionFilter = "all" | "with" | "without";

const promotionFilterLabel: Record<Exclude<PromotionFilter, "all">, string> = {
  with: "Con promoción activa",
  without: "Sin promoción activa",
};

const promotionFilterDefinitions: FilterDefinition[] = [
  {
    key: "has_active_promotion",
    label: "Promociones",
    type: "select",
    options: (
      Object.keys(promotionFilterLabel) as Exclude<PromotionFilter, "all">[]
    ).map((value) => ({
      value,
      label: promotionFilterLabel[value],
    })),
    valueFormatter: (value) =>
      promotionFilterLabel[value as Exclude<PromotionFilter, "all">],
  },
];

function ViewProductMenuItem({ productId }: { productId: string }) {
  const navigate = useNavigate();

  return (
    <DropdownMenuItem
      onClick={() =>
        navigate({ to: "/admin/products/$productId", params: { productId } })
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
    <Can policy={PERMISSIONS.productUpdate}>
      <DropdownMenuItem
        variant="destructive"
        onClick={handleArchive}
        disabled={pending || product.status === "archive"}
      >
        <span>Eliminar</span>
      </DropdownMenuItem>
    </Can>
  );
}

function ProductsListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("all");
  const [promoFilter, setPromoFilter] = useState<PromotionFilter>("all");
  const [isLookingUpSku, setIsLookingUpSku] = useState(false);
  const navigate = useNavigate();

  const {
    data: res,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useListProductsRequest({
    page: page + 1,
    limit: PAGE_SIZE,
    is_archived: status === "archive",
    status:
      status === "all" ? undefined : status === "archive" ? undefined : status,
    search: appliedSearch || undefined,
    has_active_promotion:
      promoFilter === "all" ? undefined : promoFilter === "with",
  });

  const products = res?.status === 200 ? res.data.data : [];
  const total = res?.status === 200 ? res.data.total : 0;
  const hasError = Boolean(error) || Boolean(res && res.status !== 200);

  async function handleSkuSearch() {
    const sku = search.trim();
    if (!sku || isLookingUpSku) return;

    setIsLookingUpSku(true);
    try {
      // Encode the SKU as a single path segment (SKUs can contain URL characters).
      const result = await getVariantBySkuRequest(encodeURIComponent(sku));

      if (result.status === 200) {
        navigate({
          to: "/admin/products/$productId/variants/$variantId",
          params: {
            productId: result.data.product_id,
            variantId: result.data.variant_id,
          },
        });
      } else if (result.status === 404) {
        toast.error(`No se encontró el SKU "${sku}".`);
      } else {
        toast.error("No se pudo buscar el SKU.");
      }
    } catch {
      toast.error("No se pudo buscar el SKU.");
    } finally {
      setIsLookingUpSku(false);
    }
  }

  function handleClearFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatus("all");
    setPromoFilter("all");
    setPage(0);
  }

  function handlePromotionFilterChange(
    _key: string,
    value: string | undefined
  ) {
    setPromoFilter(value === "with" || value === "without" ? value : "all");
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
        <div className="flex items-center gap-3">
          <ProductThumbnail productId={product.id} alt={product.display_name} />
          <span className="font-medium">{product.display_name}</span>
        </div>
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
            <Can policy={PERMISSIONS.productUpdate}>
              <>
                <DropdownMenuSeparator />
                <ArchiveProductMenuItem product={product} onSuccess={mutate} />
              </>
            </Can>
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
              render={<Link to="/admin/categories" />}
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
                disabled={isLookingUpSku}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSkuSearch();
                  }
                }}
                placeholder="Buscar por nombre, marca o categoría; Enter para buscar por SKU"
                aria-label="Buscar por nombre, marca o categoría; presiona Enter para buscar un SKU"
                aria-busy={isLookingUpSku}
              />
            </InputGroup>

            <div className="flex items-center gap-2">
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
                  <SelectItem value="archive">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <EntityFilterBar
              filters={promotionFilterDefinitions}
              values={{
                has_active_promotion:
                  promoFilter === "all" ? undefined : promoFilter,
              }}
              pinned={["has_active_promotion"]}
              onChange={handlePromotionFilterChange}
              onClear={() => {
                setPromoFilter("all");
                setPage(0);
              }}
            />

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
