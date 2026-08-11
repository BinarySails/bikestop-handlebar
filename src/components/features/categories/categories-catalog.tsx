/* oxlint-disable react/no-unstable-nested-components -- column cells are render callbacks, not components */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  MoreVertical,
  Pencil,
  SearchIcon,
  Shapes,
  Trash2,
} from "lucide-react";

import { SiteHeader } from "@/components/features/layout/site-header";
import { EntityCardTitle } from "@/components/features/entity/entity-card-title";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
import {
  EntityIndexPage,
  type EntityColumn,
} from "@/components/features/entity/entity-index-page";
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
import { useGetCategoriesRequest } from "@/lib/api/api";
import type { Category } from "@/lib/api/schemas";

import { CategoryDeleteDialog } from "./category-delete-dialog";
import { CategoryFormDialog } from "./category-form-dialog";
import { buildCategoryOptions } from "./category-hierarchy";

export type CategoryCatalogFilters = {
  display_name?: string;
};

type CategoriesCatalogProps = {
  filters: CategoryCatalogFilters;
  onFiltersChange: (filters: CategoryCatalogFilters) => void;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : dateFormatter.format(date);
}

export function CategoriesCatalog({
  filters,
  onFiltersChange,
}: CategoriesCatalogProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(filters.display_name ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  const listQuery = useGetCategoriesRequest(filters);
  const hierarchyQuery = useGetCategoriesRequest();
  const listResponse =
    listQuery.data?.status === 200 ? listQuery.data.data : undefined;
  const hierarchyResponse =
    hierarchyQuery.data?.status === 200 ? hierarchyQuery.data.data : undefined;
  const categories = useMemo(
    () => listResponse?.categories ?? [],
    [listResponse?.categories]
  );
  const hierarchyCategories = useMemo(
    () => hierarchyResponse?.categories ?? categories,
    [categories, hierarchyResponse?.categories]
  );
  const categoryMap = useMemo(
    () =>
      new Map(hierarchyCategories.map((category) => [category.id, category])),
    [hierarchyCategories]
  );
  const categoryRows = useMemo(() => {
    const options = buildCategoryOptions(hierarchyCategories);
    if (!filters.display_name) return options;

    const visibleIds = new Set(categories.map((category) => category.id));
    for (const category of categories) {
      let parentId = category.parent_id;
      while (parentId) {
        if (visibleIds.has(parentId)) break;
        visibleIds.add(parentId);
        parentId = categoryMap.get(parentId)?.parent_id ?? null;
      }
    }

    return options.filter(({ category }) => visibleIds.has(category.id));
  }, [categories, categoryMap, filters.display_name, hierarchyCategories]);

  useEffect(() => {
    setSearchValue(filters.display_name ?? "");
  }, [filters.display_name]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const display_name = searchValue.trim() || undefined;
      if (display_name !== filters.display_name) {
        onFiltersChange({ ...filters, display_name });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters, onFiltersChange, searchValue]);

  const hasFilters = Boolean(filters.display_name);
  const hasError =
    Boolean(listQuery.error) ||
    (Boolean(listQuery.data) && listQuery.data!.status !== 200);
  const getParentName = (category: Category): string => {
    if (!category.parent_id) return "Sin categoría padre";
    return (
      categoryMap.get(category.parent_id)?.display_name ??
      "Categoría padre no disponible"
    );
  };

  const columns: EntityColumn<{ category: Category; depth: number }>[] = [
    {
      header: "Nombre",
      cell: ({ category, depth }) => (
        <span className="font-medium">
          <span
            className="flex items-center gap-2"
            style={{ paddingInlineStart: `${depth * 1.5}rem` }}
          >
            {depth > 0 && (
              <span className="text-muted-foreground" aria-hidden="true">
                └─
              </span>
            )}
            <span>{category.display_name}</span>
            <span className="sr-only">Nivel jerárquico {depth + 1}</span>
          </span>
        </span>
      ),
    },
    {
      header: "Slug",
      cell: ({ category }) => (
        <span className="font-mono text-xs">{category.slug}</span>
      ),
    },
    {
      header: "Descripción",
      cell: ({ category }) => (
        <span
          className="max-w-72 truncate text-muted-foreground"
          title={category.description ?? undefined}
        >
          {category.description || "Sin descripción"}
        </span>
      ),
    },
    {
      header: "Padre",
      cell: ({ category }) => <span>{getParentName(category)}</span>,
    },
    {
      header: "Estado",
      cell: ({ category }) => (
        <Badge variant={category.status === "active" ? "default" : "secondary"}>
          {category.status === "active" ? "Activa" : "Inactiva"}
        </Badge>
      ),
    },
    {
      header: "Creación",
      cell: ({ category }) => (
        <span className="whitespace-nowrap">
          {formatDate(category.created_at)}
        </span>
      ),
    },
    {
      header: <span className="sr-only">Acciones</span>,
      className: "w-12",
      cell: ({ category }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Acciones de ${category.display_name}`}
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/categories/$categoryId",
                  params: { categoryId: category.id },
                })
              }
            >
              <Eye className="size-4" /> Ver
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/categories/$categoryId/edit",
                  params: { categoryId: category.id },
                })
              }
            >
              <Pencil className="size-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeletingCategory(category)}
            >
              <Trash2 className="size-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SiteHeader
        title="Categorías"
        description="Administra el catálogo y la jerarquía de categorías de productos."
        actions={
          <EntityCreateButton
            onClick={() => {
              setFormOpen(true);
            }}
          >
            Nueva categoría
          </EntityCreateButton>
        }
      />
      <EntityIndexPage<{ category: Category; depth: number }>
        ariaLabel="Categorías"
        cardTitle={
          <EntityCardTitle icon={Shapes}>
            Catálogo de categorías
          </EntityCardTitle>
        }
        cardHeaderExtras={
          <InputGroup className="w-full max-w-xl">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar por nombre o descripción"
              aria-label="Buscar categorías"
            />
          </InputGroup>
        }
        columns={columns}
        rows={categoryRows}
        rowKey={({ category }) => category.id}
        rowClassName={({ depth }) => (depth === 0 ? "bg-muted/50" : undefined)}
        loading={listQuery.isLoading}
        validating={listQuery.isValidating && Boolean(listQuery.data)}
        hasError={hasError}
        errorMessage="No se pudieron cargar las categorías. Revisa tu conexión e intenta nuevamente."
        onRetry={() => listQuery.mutate()}
        emptyMessage={
          hasFilters
            ? "No hay coincidencias."
            : "No hay categorías registradas."
        }
      />

      <CategoryFormDialog
        key="new"
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={hierarchyCategories}
        onSaved={async () => {
          await Promise.all([listQuery.mutate(), hierarchyQuery.mutate()]);
        }}
      />
      <CategoryDeleteDialog
        category={deletingCategory}
        categories={hierarchyCategories}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        onDeleted={async () => {
          await Promise.all([listQuery.mutate(), hierarchyQuery.mutate()]);
        }}
      />
    </>
  );
}
