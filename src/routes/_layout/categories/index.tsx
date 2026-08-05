import { useState, useMemo } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Pencil,
  Trash2,
  Plus,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetCategoriesRequest,
  useDeleteCategoryRequest,
} from "@/lib/api/api";
import type { Category } from "@/lib/api/schemas";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateCategoryDialog } from "@/components/features/products/create-category-modal";

export const Route = createFileRoute("/_layout/categories/")({
  component: CategoriesPage,
});

const PAGE_SIZE = 10;

function CategoriesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteCategory, setDeleteCategory] = useState<Category | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, mutate } = useGetCategoriesRequest();
  const { trigger: deleteTrigger, isMutating: isDeleting } =
    useDeleteCategoryRequest(deleteCategory?.id ?? "");

  const allCategories = useMemo(
    () => (data?.status === 200 ? data.data.categories : []),
    [data]
  );

  const categoryMap = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c])),
    [allCategories]
  );

  const filteredCategories = useMemo(() => {
    if (activeTab === "active")
      return allCategories.filter((c) => c.status === "active");
    if (activeTab === "inactive")
      return allCategories.filter((c) => c.status === "inactive");
    return allCategories;
  }, [allCategories, activeTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE)
  );
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return;
    try {
      const result = await deleteTrigger(null);
      if (result?.status === 200) {
        toast.success(`Categoría "${deleteCategory.display_name}" eliminada.`);
        setDeleteCategory(undefined);
        mutate();
      } else {
        toast.error("Error al eliminar la categoría.");
      }
    } catch {
      toast.error("Error al eliminar la categoría.");
    }
  };

  return (
    <main className="container mx-auto max-w-5xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/products" />}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Administra las categorías de productos.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateOpen(true);
          }}
          size="sm"
        >
          <Plus />
          Crear Categoría
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
        }}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="all">Todos ({allCategories.length})</TabsTrigger>
          <TabsTrigger value="active">
            Activos ({allCategories.filter((c) => c.status === "active").length}
            )
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactivos (
            {allCategories.filter((c) => c.status === "inactive").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : paginatedCategories.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay categorías{" "}
                {activeTab === "active"
                  ? "activas"
                  : activeTab === "inactive"
                    ? "inactivas"
                    : "registradas"}
                .
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Padre</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow
                      key={category.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/categories/$categoryId",
                          params: { categoryId: category.id },
                        })
                      }
                    >
                      <TableCell className="font-medium">
                        {category.display_name}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            category.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="gap-1"
                        >
                          {category.status === "active" ? (
                            <CircleCheck className="size-3" />
                          ) : (
                            <CircleX className="size-3" />
                          )}
                          {category.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.parent_id
                          ? (categoryMap.get(category.parent_id)
                              ?.display_name ?? "—")
                          : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                          >
                            <MoreHorizontal className="size-4" />
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
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteCategory(category)}
                            >
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Eliminar Categoría</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿Estás seguro de eliminar la categoría{" "}
              <strong>{deleteCategory.display_name}</strong>?
              {deleteCategory.status === "active" && (
                <span className="mt-2 block text-destructive">
                  Esta categoría está activa. Si tiene productos o subcategorías
                  asignadas, no se podrá eliminar.
                </span>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteCategory(undefined)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          mutate();
          setCreateOpen(false);
        }}
      />
    </main>
  );
}
