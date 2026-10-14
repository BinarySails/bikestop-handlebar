import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import {
  CategoriesCatalog,
  type CategoryCatalogFilters,
} from "@/components/features/categories/categories-catalog";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePolicy } from "@/lib/auth/require-auth";

const categorySearchSchema = z.object({
  display_name: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/admin/categories/")({
  beforeLoad: async ({ location }) => {
    await requirePolicy(PERMISSIONS.categoryView, {
      from: location.href,
      navigateTo: "/login",
    });
  },
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
