import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  archiveBrand,
  BrandApiError,
  createBrand,
  invalidateBrands,
  toggleBrand,
  updateBrand,
  useBrand,
  useBrands,
} from "@/lib/api/brands";
import type { Brand } from "@/lib/api/schemas";

import { BrandActionDialog, type BrandAction } from "./brand-action-dialog";
import { BrandDetailDialog } from "./brand-detail-dialog";
import {
  BrandFormDialog,
  type BrandFormErrors,
  type BrandFormValues,
} from "./brand-form-dialog";
import { BrandsCatalogView, type BrandOrder } from "./brands-catalog-view";

export type BrandCatalogFilters = {
  page?: number;
  limit?: number;
  display_name?: string;
  order?: BrandOrder;
};

type BrandsCatalogProps = {
  filters: BrandCatalogFilters;
  onFiltersChange: (filters: BrandCatalogFilters) => void;
};

function mutationErrors(error: unknown): BrandFormErrors {
  if (error instanceof BrandApiError) {
    if (error.status === 409)
      return { display_name: "Ya existe una marca con este nombre." };
    if (error.status === 400) return { form: error.message };
    if (error.status === 404)
      return { form: "La marca ya no está disponible." };
    if (error.status === 0) return { form: error.message };
  }
  return { form: "No se pudo guardar la marca. Intenta nuevamente." };
}

export function BrandsCatalog({
  filters,
  onFiltersChange,
}: BrandsCatalogProps) {
  const page = filters.page ?? 0;
  const limit = filters.limit ?? 10;
  const [search, setSearch] = useState(filters.display_name ?? "");
  const [formBrand, setFormBrand] = useState<Brand | null | undefined>();
  const [detailId, setDetailId] = useState<string>();
  const [action, setAction] = useState<{
    brand: Brand;
    type: BrandAction;
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const listQuery = useBrands({
    page,
    limit,
    display_name: filters.display_name,
    order: filters.order,
  });
  const detailQuery = useBrand(detailId);
  const response = listQuery.data;

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
      if (formBrand) {
        await updateBrand(formBrand.id, values);
        toast.success("Marca actualizada correctamente.");
      } else {
        await createBrand(values);
        toast.success("Marca creada correctamente.");
      }
      await invalidateBrands();
    } catch (error) {
      return mutationErrors(error);
    }
  }

  async function handleConfirmAction() {
    if (!action || actionPending || action.brand.status === "archive") return;
    setActionPending(true);
    try {
      if (action.type === "archive") {
        await archiveBrand(action.brand.id);
        toast.success("Marca archivada correctamente.");
      } else {
        await toggleBrand(action.brand.id);
        toast.success(
          action.brand.status === "enable"
            ? "Marca desactivada correctamente."
            : "Marca activada correctamente."
        );
      }
      await invalidateBrands();
      setAction(null);
    } catch (error) {
      if (error instanceof BrandApiError && error.status === 409) {
        toast.error("Una marca archivada no puede activarse ni desactivarse.");
      } else if (error instanceof BrandApiError && error.status === 404) {
        toast.error("La marca ya no está disponible.");
      } else if (error instanceof BrandApiError && error.status === 0) {
        toast.error(error.message);
      } else {
        toast.error(
          action.type === "archive"
            ? "No se pudo archivar la marca."
            : "No se pudo cambiar el estado de la marca."
        );
      }
    } finally {
      setActionPending(false);
    }
  }

  const listError = listQuery.error
    ? listQuery.error instanceof BrandApiError
      ? listQuery.error.message
      : "Revisa tu conexión e intenta nuevamente."
    : null;
  const detailError = detailQuery.error
    ? detailQuery.error instanceof BrandApiError &&
      detailQuery.error.status === 404
      ? "La marca ya no está disponible. Regresa al catálogo."
      : "No se pudo cargar el detalle de la marca."
    : null;

  return (
    <>
      <BrandsCatalogView
        brands={response?.data ?? []}
        page={response?.page ?? page}
        limit={response?.limit ?? limit}
        total={response?.total ?? 0}
        search={search}
        order={filters.order}
        loading={listQuery.isLoading}
        refreshing={listQuery.isValidating && Boolean(response)}
        error={listError}
        onSearchChange={setSearch}
        onOrderChange={(order) =>
          onFiltersChange({ ...filters, page: undefined, order })
        }
        onLimitChange={(nextLimit) =>
          onFiltersChange({ ...filters, page: undefined, limit: nextLimit })
        }
        onPageChange={(nextPage) =>
          onFiltersChange({ ...filters, page: nextPage || undefined })
        }
        onClearFilters={() => {
          setSearch("");
          onFiltersChange({ limit: filters.limit });
        }}
        onRetry={() => listQuery.mutate()}
        onCreate={() => setFormBrand(null)}
        onView={(brand) => setDetailId(brand.id)}
        onEdit={setFormBrand}
        onToggle={(brand) => setAction({ brand, type: "toggle" })}
        onArchive={(brand) => setAction({ brand, type: "archive" })}
      />
      <BrandFormDialog
        key={formBrand?.id ?? "create"}
        open={formBrand !== undefined}
        brand={formBrand}
        onOpenChange={(open) => {
          if (!open) setFormBrand(undefined);
        }}
        onSubmit={handleSave}
      />
      <BrandDetailDialog
        open={Boolean(detailId)}
        brand={detailQuery.data ?? null}
        loading={detailQuery.isLoading}
        error={detailError}
        onOpenChange={(open) => {
          if (!open) setDetailId(undefined);
        }}
        onRetry={() => detailQuery.mutate()}
      />
      <BrandActionDialog
        brand={action?.brand ?? null}
        action={action?.type ?? "toggle"}
        pending={actionPending}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}
