import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

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
import { BrandsCatalogView } from "./brands-catalog-view";

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

  const listError =
    listQuery.error || (listQuery.data && listQuery.data.status !== 200)
      ? "Revisa tu conexión e intenta nuevamente."
      : null;
  return (
    <>
      <BrandsCatalogView
        brands={visibleBrands}
        page={response?.page ?? page}
        limit={response?.limit ?? limit}
        total={response?.total ?? 0}
        search={search}
        archivedOnly={archivedOnly}
        loading={listQuery.isLoading}
        refreshing={listQuery.isValidating && Boolean(response)}
        error={listError}
        onSearchChange={setSearch}
        onArchivedOnlyChange={setArchivedOnly}
        onPageChange={(nextPage) =>
          onFiltersChange({ ...filters, page: nextPage || undefined })
        }
        onRetry={() => listQuery.mutate()}
        onCreate={() => setCreateOpen(true)}
        onView={(brand) =>
          navigate({ to: "/brands/$brandId", params: { brandId: brand.id } })
        }
        onEdit={(brand) =>
          navigate({
            to: "/brands/$brandId/edit",
            params: { brandId: brand.id },
          })
        }
        onArchive={setArchiveBrand}
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
