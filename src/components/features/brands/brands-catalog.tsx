/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Archive, Eye, MoreVertical, SearchIcon, Tags } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
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
  createBrandRequest,
  deleteBrandRequest,
  useListBrandsRequest,
} from "@/lib/api/api";
import type { Brand, ErrorResponse } from "@/lib/api/schemas";

import { BrandActionDialog } from "./brand-action-dialog";
import {
  BrandFormDialog,
  type BrandFormErrors,
  type BrandFormValues,
} from "./brand-form-dialog";
import { BrandImage } from "./brand-image";
import { BrandStatusBadge } from "./brand-status-badge";

export type BrandCatalogFilters = {
  page?: number;
  display_name?: string;
};

type BrandsCatalogProps = {
  filters: BrandCatalogFilters;
  onFiltersChange: (filters: BrandCatalogFilters) => void;
};

function mutationErrors(
  status: number,
  error?: ErrorResponse
): BrandFormErrors {
  if (status === 409)
    return { display_name: "Ya existe una marca con este nombre." };
  if (status === 400)
    return { form: error?.message ?? "Los datos de la marca no son válidos." };
  if (status === 404) return { form: "La marca ya no está disponible." };
  return { form: "No se pudo guardar la marca. Intenta nuevamente." };
}

export function BrandsCatalog({
  filters,
  onFiltersChange,
}: BrandsCatalogProps) {
  const navigate = useNavigate();
  const page = filters.page ?? 0;
  const limit = 10;
  const [search, setSearch] = useState(filters.display_name ?? "");
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [archiveBrand, setArchiveBrand] = useState<Brand | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const listQuery = useListBrandsRequest({
    page,
    limit,
    display_name: filters.display_name,
  });
  const response =
    listQuery.data?.status === 200 ? listQuery.data.data : undefined;
  const visibleBrands =
    response?.data.filter((brand) =>
      archivedOnly ? brand.status === "archive" : brand.status !== "archive"
    ) ?? [];

  useEffect(
    () => setSearch(filters.display_name ?? ""),
    [filters.display_name]
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const display_name = search.trim() || undefined;
      if (display_name !== filters.display_name) {
        onFiltersChange({ ...filters, page: undefined, display_name });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters, onFiltersChange, search]);

  async function handleSave(
    values: BrandFormValues
  ): Promise<BrandFormErrors | void> {
    try {
      const result = await createBrandRequest(values);
      if (result.status !== 201)
        return mutationErrors(result.status, result.data);
      toast.success("Marca creada correctamente.");
      await listQuery.mutate();
    } catch {
      return mutationErrors(0);
    }
  }

  async function handleConfirmAction() {
    if (!archiveBrand || actionPending || archiveBrand.status === "archive")
      return;
    setActionPending(true);
    try {
      const result = await deleteBrandRequest(archiveBrand.id);
      if (result.status !== 200) throw result;
      toast.success("Marca archivada correctamente.");
      await listQuery.mutate();
      setArchiveBrand(null);
    } catch (error) {
      const status =
        typeof error === "object" && error && "status" in error
          ? error.status
          : 0;
      if (status === 404) {
        toast.error("La marca ya no está disponible.");
      } else {
        toast.error("No se pudo archivar la marca.");
      }
    } finally {
      setActionPending(false);
    }
  }

  const hasError =
    Boolean(listQuery.error) ||
    (Boolean(listQuery.data) && listQuery.data!.status !== 200);

  const columns: EntityColumn<Brand>[] = [
    {
      header: "Marca",
      cell: (brand) => (
        <div className="flex items-center gap-4">
          <BrandImage
            src={brand.image_url}
            alt={brand.display_name}
            className="size-14 rounded-xl bg-background shadow-sm"
          />
          <div className="flex min-w-0 items-center gap-3">
            <p className="truncate text-base font-semibold tracking-tight">
              {brand.display_name}
            </p>
            {archivedOnly && <BrandStatusBadge status="archive" />}
          </div>
        </div>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: (brand) => {
        const archived = brand.status === "archive";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Acciones de ${brand.display_name}`}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  navigate({
                    to: "/brands/$brandId/edit",
                    params: { brandId: brand.id },
                  })
                }
              >
                <Eye /> Ver
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={archived}
                onClick={() => setArchiveBrand(brand)}
              >
                <Archive /> {archived ? "Marca archivada" : "Archivar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <SiteHeader
        title="Marcas"
        description="Gestiona las marcas de productos disponibles en BikeStop."
        actions={
          <EntityCreateButton
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Crear marca
          </EntityCreateButton>
        }
      />
      <EntityIndexPage<Brand>
        ariaLabel="Marcas"
        cardTitle={
          <EntityCardTitle icon={Tags}>Catálogo de marcas</EntityCardTitle>
        }
        cardHeaderExtras={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup className="w-full max-w-xl">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre"
                aria-label="Buscar marcas"
              />
            </InputGroup>
            <Button
              type="button"
              variant="outline"
              className="sm:ml-auto"
              aria-pressed={archivedOnly}
              onClick={() => setArchivedOnly(!archivedOnly)}
            >
              <Archive />
              {archivedOnly ? "Mostrar activas" : "Mostrar archivadas"}
            </Button>
          </div>
        }
        columns={columns}
        rows={visibleBrands}
        rowKey={(brand) => brand.id}
        loading={listQuery.isLoading}
        validating={listQuery.isValidating && Boolean(response)}
        hasError={hasError}
        errorMessage="No se pudieron cargar las marcas. Revisa tu conexión e intenta nuevamente."
        onRetry={() => listQuery.mutate()}
        emptyMessage={
          search
            ? "No encontramos marcas para esta búsqueda."
            : "No hay marcas registradas."
        }
        pagination={{
          mode: "page",
          total: response?.total ?? 0,
          page,
          pageSize: limit,
          totalLabel: "marcas",
          onPageChange: (nextPage) =>
            onFiltersChange({ ...filters, page: nextPage || undefined }),
        }}
      />

      <BrandFormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
        }}
        onSubmit={handleSave}
      />
      <BrandActionDialog
        brand={archiveBrand}
        pending={actionPending}
        onOpenChange={(open) => {
          if (!open) setArchiveBrand(null);
        }}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}
