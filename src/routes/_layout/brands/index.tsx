import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import {
  BrandsCatalog,
  type BrandCatalogFilters,
} from "@/components/features/brands/brands-catalog";

const brandSearchSchema = z.object({
  page: z.coerce.number().int().nonnegative().optional().catch(undefined),
  display_name: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_layout/brands/")({
  validateSearch: brandSearchSchema,
  component: BrandsPage,
});

function BrandsPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  function handleFiltersChange(nextFilters: BrandCatalogFilters) {
    navigate({ search: nextFilters, replace: true });
  }

  return (
    <BrandsCatalog filters={filters} onFiltersChange={handleFiltersChange} />
  );
}
