/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Boxes, MoreVertical, RotateCcw, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
import { CreateVariantDialog } from "@/components/features/products/create-variant-modal";
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
import { useListVariantsRequest, useUpdateVariantRequest } from "@/lib/api/api";
import type { Variant } from "@/lib/api/schemas";

const PAGE_SIZE = 10;

type ListStatusFilter = "all" | "enable" | "disable" | "archive";

const statusBadgeVariant: Record<
  Variant["status"],
  "default" | "secondary" | "destructive"
> = {
  enable: "default",
  disable: "secondary",
  archive: "destructive",
};

const statusLabel: Record<Variant["status"], string> = {
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

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatProperties(properties: Variant["properties"]): string {
  if (properties.length === 0) return "—";
  return properties
    .filter((property) => property.status !== "archive")
    .map(
      (property) =>
        `${capitalizeFirst(property.property_name)}: ${capitalizeFirst(property.property_value)}`
    )
    .join(", ");
}

function formatRegularPrice(prices: Variant["prices"]): string {
  const regular = prices.find(
    (price) => price.price_type === "regular" && price.status === "enable"
  );
  if (!regular) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: regular.currency,
  }).format(regular.amount / 100);
}

function ViewVariantMenuItem({
  productId,
  variantId,
}: {
  productId: string;
  variantId: string;
}) {
  const navigate = useNavigate();

  return (
    <DropdownMenuItem
      onClick={() =>
        navigate({
          to: "/admin/products/$productId/variants/$variantId",
          params: { productId, variantId },
        })
      }
    >
      Ver
    </DropdownMenuItem>
  );
}

function ArchiveVariantMenuItem({
  productId,
  variant,
  onSuccess,
}: {
  productId: string;
  variant: Variant;
  onSuccess?: () => Promise<unknown>;
}) {
  const { trigger: updateVariant } = useUpdateVariantRequest(
    productId,
    variant.id
  );
  const [pending, setPending] = useState(false);

  async function handleArchive() {
    setPending(true);
    try {
      const result = await updateVariant({
        sku: variant.sku,
        display_name: variant.display_name,
        description: variant.description,
        images: (variant.images ?? [])
          .slice()
          .sort((a, b) => a.image_index - b.image_index)
          .map((image, index) => ({
            image_index: index + 1,
            image_url: image.image_url,
          })),
        status: "archive",
        properties: variant.properties.map((property) => ({
          property_name: property.property_name,
          property_value: property.property_value,
          status: property.status,
        })),
        prices: variant.prices.map((price) => ({
          price_type: price.price_type,
          amount: price.amount,
          currency: price.currency,
          status: price.status,
        })),
      });

      if (result.status === 200) {
        toast.success(`Variante "${variant.display_name}" archivada.`);
        await onSuccess?.();
      } else {
        toast.error("No se pudo archivar la variante.");
      }
    } catch {
      toast.error("No se pudo archivar la variante.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenuItem
      variant="destructive"
      onClick={handleArchive}
      disabled={pending || variant.status === "archive"}
    >
      Eliminar
    </DropdownMenuItem>
  );
}

export function ProductVariantsSection({ productId }: { productId: string }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("all");

  const {
    data: res,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useListVariantsRequest(
    productId,
    {
      is_archived: status === "archive",
    },
    {
      swr: {
        revalidateOnFocus: false,
      },
    }
  );

  const allVariants = res?.status === 200 ? res.data : [];
  const hasError = Boolean(error) || Boolean(res && res.status !== 200);

  const term = appliedSearch.trim().toLowerCase();
  const filteredVariants = allVariants.filter((variant) => {
    if (status !== "all" && variant.status !== status) return false;
    if (!term) return true;
    const searchable = [
      variant.display_name,
      variant.sku,
      formatProperties(variant.properties),
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(term);
  });

  const pageVariants = filteredVariants.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

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

  const columns: EntityColumn<Variant>[] = [
    {
      header: "Estatus",
      cell: (variant) => (
        <Badge variant={statusBadgeVariant[variant.status]}>
          {statusLabel[variant.status]}
        </Badge>
      ),
    },
    {
      header: "SKU",
      cell: (variant) => <span className="font-medium">{variant.sku}</span>,
    },
    {
      header: "Nombre",
      cell: (variant) => <span>{variant.display_name}</span>,
    },
    {
      header: "Propiedades",
      cell: (variant) => (
        <span className="text-muted-foreground">
          {formatProperties(variant.properties)}
        </span>
      ),
    },
    {
      header: "Precio regular",
      cell: (variant) => (
        <span className="font-medium">
          {formatRegularPrice(variant.prices)}
        </span>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (variant) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Acciones de ${variant.display_name}`}
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <ViewVariantMenuItem productId={productId} variantId={variant.id} />
            <DropdownMenuSeparator />
            <ArchiveVariantMenuItem
              productId={productId}
              variant={variant}
              onSuccess={mutate}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <section id="variants" className="scroll-mt-4 space-y-6">
      <EntityIndexPage<Variant>
        className="max-w-none p-0 sm:p-[unset]"
        ariaLabel="Variantes del producto"
        cardTitle={
          <EntityCardTitle icon={Boxes}>Catálogo de variantes</EntityCardTitle>
        }
        cardHeaderExtras={
          <div className="flex flex-col gap-3">
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
                  placeholder="Buscar por nombre, SKU o propiedad"
                  aria-label="Buscar por nombre, SKU o propiedad"
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleClearFilters}
                >
                  <RotateCcw />
                  Limpiar
                </Button>
                <CreateVariantDialog productId={productId} onSuccess={mutate} />
              </div>
            </div>
          </div>
        }
        columns={columns}
        rows={pageVariants}
        rowKey={(variant) => variant.id}
        loading={isLoading}
        validating={isValidating && !!res}
        hasError={hasError}
        errorMessage="Error al cargar las variantes."
        onRetry={() => mutate()}
        emptyMessage="No hay variantes que coincidan con los filtros."
        pagination={{
          mode: "page",
          total: filteredVariants.length,
          page,
          pageSize: PAGE_SIZE,
          totalLabel: "variantes",
          onPageChange: (nextPage) => setPage(nextPage),
        }}
      />
    </section>
  );
}
