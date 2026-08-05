import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories } from "@/lib/api/categories";
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

function CategoriesSkeleton() {
  return (
    <div className="space-y-3" aria-label="Cargando categorías">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
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

  const listQuery = useCategories(filters);
  const hierarchyQuery = useCategories();
  const categories = useMemo(
    () => listQuery.data?.categories ?? [],
    [listQuery.data?.categories]
  );
  const hierarchyCategories = useMemo(
    () => hierarchyQuery.data?.categories ?? categories,
    [categories, hierarchyQuery.data?.categories]
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
  const getParentName = (category: Category): string => {
    if (!category.parent_id) return "Sin categoría padre";
    return (
      categoryMap.get(category.parent_id)?.display_name ??
      "Categoría padre no disponible"
    );
  };

  return (
    <section
      aria-label="Categorías"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Administra el catálogo y la jerarquía de categorías de productos.
          </p>
        </div>
        <Button
          onClick={() => {
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Nueva categoría
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Tags className="size-4" /> Catálogo de categorías
          </CardTitle>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="pl-9"
                type="search"
                aria-label="Buscar categorías"
                placeholder="Buscar por nombre o descripción"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <CategoriesSkeleton />
          ) : listQuery.error ? (
            <div
              className="flex flex-col items-center gap-3 py-10 text-center"
              role="alert"
            >
              <p className="font-medium">
                No se pudieron cargar las categorías.
              </p>
              <p className="text-sm text-muted-foreground">
                Revisa tu conexión e intenta nuevamente.
              </p>
              <Button variant="outline" onClick={() => listQuery.mutate()}>
                Reintentar
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">
                {hasFilters
                  ? "No hay coincidencias."
                  : "No hay categorías registradas."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? "Prueba con otros filtros."
                  : "Crea la primera categoría para comenzar."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Listado de categorías">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="min-w-56">Descripción</TableHead>
                    <TableHead>Padre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creación</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryRows.map(({ category, depth }) => (
                    <TableRow
                      key={category.id}
                      className={depth === 0 ? "bg-muted/50" : undefined}
                    >
                      <TableCell className="font-medium">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingInlineStart: `${depth * 1.5}rem` }}
                        >
                          {depth > 0 && (
                            <span
                              className="text-muted-foreground"
                              aria-hidden="true"
                            >
                              └─
                            </span>
                          )}
                          <span>{category.display_name}</span>
                          <span className="sr-only">
                            Nivel jerárquico {depth + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {category.slug}
                      </TableCell>
                      <TableCell
                        className="max-w-72 truncate text-muted-foreground"
                        title={category.description ?? undefined}
                      >
                        {category.description || "Sin descripción"}
                      </TableCell>
                      <TableCell>{getParentName(category)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            category.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {category.status === "active" ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(category.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Acciones de ${category.display_name}`}
                                className="size-8"
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {listQuery.isValidating && (
                <p
                  className="mt-3 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  Actualizando categorías…
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        key="new"
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={hierarchyCategories}
      />
      <CategoryDeleteDialog
        category={deletingCategory}
        categories={hierarchyCategories}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      />
    </section>
  );
}
