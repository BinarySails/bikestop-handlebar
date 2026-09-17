/* oxlint-disable react/incompatible-library -- TanStack Table cannot be memoized safely */
/* oxlint-disable react/no-unstable-nested-components -- TanStack Table cell renderers are callbacks, not components */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  createColumnHelper,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetCategoriesRequest } from "@/lib/api/api";
import type { Category } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

import { CategoryDeleteDialog } from "./category-delete-dialog";
import { CategoryFormDialog } from "./category-form-dialog";

export type CategoryCatalogFilters = {
  display_name?: string;
};

type CategoriesCatalogProps = {
  filters: CategoryCatalogFilters;
  onFiltersChange: (filters: CategoryCatalogFilters) => void;
};

type CategoryTreeNode = Category & { children: CategoryTreeNode[] };

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : dateFormatter.format(date);
}

function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const childrenMap = new Map<string | null, Category[]>();

  for (const category of categories) {
    const parentKey =
      category.parent_id && categoryMap.has(category.parent_id)
        ? category.parent_id
        : null;
    const siblings = childrenMap.get(parentKey) ?? [];
    siblings.push(category);
    childrenMap.set(parentKey, siblings);
  }

  for (const siblings of childrenMap.values()) {
    siblings.sort((a, b) => a.display_name.localeCompare(b.display_name, "es"));
  }

  const visited = new Set<string>();

  function buildNode(
    category: Category,
    depth: number
  ): CategoryTreeNode | null {
    if (visited.has(category.id)) return null;
    visited.add(category.id);
    const children = (childrenMap.get(category.id) ?? [])
      .map((child) => buildNode(child, depth + 1))
      .filter((node): node is CategoryTreeNode => node !== null);
    return { ...category, children };
  }

  const tree: CategoryTreeNode[] = [];
  for (const root of childrenMap.get(null) ?? []) {
    const node = buildNode(root, 0);
    if (node) tree.push(node);
  }
  for (const category of categories) {
    const node = buildNode(category, 0);
    if (node) tree.push(node);
  }
  return tree;
}

function getFlatFilteredRows(
  rows: CategoryTreeNode[],
  visibleIds: Set<string>,
  categoryMap: Map<string, Category>
): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  for (const row of rows) {
    if (!visibleIds.has(row.id)) continue;
    const children = getFlatFilteredRows(row.children, visibleIds, categoryMap);
    result.push({ ...row, children });
  }
  return result;
}

const columnHelper = createColumnHelper<CategoryTreeNode>();

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
  const [expanded, setExpanded] = useState<ExpandedState>(true);

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

  const categoryTree = useMemo(
    () => buildCategoryTree(hierarchyCategories),
    [hierarchyCategories]
  );

  const tableData = useMemo(() => {
    if (!filters.display_name) return categoryTree;
    const visibleIds = new Set(categories.map((c) => c.id));
    for (const category of categories) {
      let parentId = category.parent_id;
      while (parentId) {
        if (visibleIds.has(parentId)) break;
        visibleIds.add(parentId);
        parentId = categoryMap.get(parentId)?.parent_id ?? null;
      }
    }
    return getFlatFilteredRows(categoryTree, visibleIds, categoryMap);
  }, [categoryTree, categories, categoryMap, filters.display_name]);

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

  const getParentName = useCallback(
    (category: Category): string => {
      if (!category.parent_id) return "Sin categoría padre";
      return (
        categoryMap.get(category.parent_id)?.display_name ??
        "Categoría padre no disponible"
      );
    },
    [categoryMap]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("display_name", {
        header: "Nombre",
        cell: (info) => (
          <div
            className="flex items-center gap-2"
            style={{ paddingInlineStart: `${info.row.depth * 1.5}rem` }}
          >
            {info.row.getCanExpand() ? (
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={info.row.getToggleExpandedHandler()}
                style={{ cursor: "pointer" }}
              >
                {info.row.getIsExpanded() ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <span className="truncate font-medium">{info.getValue()}</span>
            <span className="sr-only">
              Nivel jerárquico {info.row.depth + 1}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("slug", {
        header: "Slug",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Descripción",
        cell: (info) => (
          <span
            className="max-w-72 truncate text-muted-foreground"
            title={info.getValue() ?? undefined}
          >
            {info.getValue() || "Sin descripción"}
          </span>
        ),
      }),
      columnHelper.accessor("parent_id", {
        header: "Padre",
        cell: (info) => {
          const category = info.row.original;
          return <span>{getParentName(category)}</span>;
        },
      }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => (
          <Badge
            variant={info.getValue() === "enable" ? "default" : "secondary"}
          >
            {info.getValue() === "enable" ? "Activa" : "Inactiva"}
          </Badge>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Creación",
        cell: (info) => (
          <span className="whitespace-nowrap">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        size: 48,
        cell: (info) => {
          const category = info.row.original;
          return (
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
                      to: "/admin/categories/$categoryId",
                      params: { categoryId: category.id },
                    })
                  }
                >
                  <Eye className="size-4" /> Ver
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate({
                      to: "/admin/categories/$categoryId/edit",
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
          );
        },
      }),
    ],
    [navigate, getParentName]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (row) =>
      row.children && row.children.length > 0 ? row.children : undefined,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
  });

  const isLoading = listQuery.isLoading && !listQuery.data;
  const isMutating = listQuery.isValidating && Boolean(listQuery.data);
  const headerGroups = table.getHeaderGroups();

  return (
    <>
      <SiteHeader
        title="Categorías"
        description="Administra el catálogo y la jerarquía de categorías de productos."
        actions={
          <EntityCreateButton onClick={() => setFormOpen(true)}>
            Nueva categoría
          </EntityCreateButton>
        }
      />

      <section
        aria-label="Categorías"
        className="mx-auto w-full max-w-7xl p-4 sm:p-6"
      >
        <Card>
          <CardHeader className="gap-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              <EntityCardTitle icon={Shapes}>
                Catálogo de categorías
              </EntityCardTitle>
            </div>
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
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                {headerGroups.map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    {Array.from({ length: 5 }, (__, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {columns.map((_, cellIndex) => (
                          <TableCell key={cellIndex} className="py-3">
                            <Skeleton className="h-5 w-full max-w-36" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </>
                )}

                {hasError && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-36 text-center"
                    >
                      <p className="mb-3 text-sm text-destructive">
                        No se pudieron cargar las categorías. Revisa tu conexión
                        e intenta nuevamente.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => listQuery.mutate()}
                      >
                        Reintentar
                      </Button>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !hasError &&
                  table.getRowModel().rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-36 text-center text-muted-foreground"
                      >
                        {hasFilters
                          ? "No hay coincidencias."
                          : "No hay categorías registradas."}
                      </TableCell>
                    </TableRow>
                  )}

                {!hasError &&
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "border-gray-100 hover:bg-gray-50/80",
                        row.depth === 0 && "bg-muted/50"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {isMutating && table.getRowModel().rows.length > 0 && (
              <div
                className="h-0.5 animate-pulse bg-primary/40"
                aria-label="Actualizando"
              />
            )}
          </CardContent>
        </Card>
      </section>

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
