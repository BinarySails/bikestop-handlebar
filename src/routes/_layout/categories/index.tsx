import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import {
  CategoriesCatalog,
  type CategoryCatalogFilters,
} from "@/components/features/categories/categories-catalog";

const categorySearchSchema = z.object({
  display_name: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_layout/categories/")({
  validateSearch: categorySearchSchema,
  component: CategoriesPage,
});

function CategoriesPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  function handleFiltersChange(nextFilters: CategoryCatalogFilters) {
    navigate({ search: nextFilters, replace: true });
  }

  return (
    <CategoriesCatalog
      filters={filters}
      onFiltersChange={handleFiltersChange}
    />
  );
}
