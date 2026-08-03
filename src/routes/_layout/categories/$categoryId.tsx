import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { CategoryDetailHeader } from "@/components/features/categories/category-detail-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteCategoryRequest,
  useGetCategoryRequest,
  useUpdateCategoryRequest,
} from "@/lib/api/api";
import type { Category } from "@/lib/api/schemas";

const mockCategories: Category[] = [
  {
    id: "1",
    display_name: "Electronics",
    slug: "electronics",
    description: null,
    created_at: "",
    parent_id: null,
    status: "active",
  },
  {
    id: "2",
    display_name: "Clothing",
    slug: "clothing",
    description: null,
    created_at: "",
    parent_id: null,
    status: "active",
  },
  {
    id: "3",
    display_name: "Books",
    slug: "books",
    description: null,
    created_at: "",
    parent_id: null,
    status: "active",
  },
  {
    id: "4",
    display_name: "Smartphones",
    slug: "smartphones",
    description: null,
    created_at: "",
    parent_id: "1",
    status: "active",
  },
  {
    id: "5",
    display_name: "Laptops",
    slug: "laptops",
    description: null,
    created_at: "",
    parent_id: "1",
    status: "active",
  },
  {
    id: "6",
    display_name: "T-Shirts",
    slug: "t-shirts",
    description: null,
    created_at: "",
    parent_id: "2",
    status: "active",
  },
];

export const Route = createFileRoute("/_layout/categories/$categoryId")({
  component: CategoryDetailPage,
});

function CategoryDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}

function CategoryDetailPage() {
  const { categoryId } = Route.useParams();
  const { data: res, error, isLoading, mutate } = useGetCategoryRequest(categoryId);

  const category: Category | null =
    res?.status === 200 ? res.data.category : null;

  if (isLoading) return <CategoryDetailSkeleton />;

  if (error || !category) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">
          Categoría no encontrada o error al cargar.
        </p>
      </div>
    );
  }

  return <CategoryDetailView category={category} mutateCategory={mutate} />;
}

function CategoryDetailView({
  category,
  mutateCategory,
}: {
  category: Category;
  mutateCategory: () => Promise<unknown>;
}) {
  const { categoryId } = Route.useParams();
  const navigate = useNavigate();
  const { trigger: updateCategory } = useUpdateCategoryRequest(categoryId);
  const { trigger: deleteCategory } = useDeleteCategoryRequest(categoryId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const isInactive = category.status === "inactive";

  const form = useForm({
    defaultValues: {
      display_name: category.display_name,
      description: category.description ?? "",
      parent:
        mockCategories.find((c) => c.id === category.parent_id) ?? null,
    },
    onSubmit: async ({ value }) => {
      const slug = value.display_name.toLowerCase().replace(/\s+/g, "-");

      if (
        value.display_name === category.display_name &&
        value.description === (category.description ?? "") &&
        (value.parent?.id ?? null) === (category.parent_id ?? null)
      ) {
        return;
      }

      try {
        const result = await updateCategory({
          display_name: value.display_name,
          slug,
          description: value.description || null,
          parent_id: value.parent?.id || null,
        });

        if (result?.status !== 200) {
          toast.error("Error al actualizar la categoría.");
          return;
        }

        toast.success("Categoría actualizada correctamente.");
        form.reset({
          display_name: value.display_name,
          description: value.description,
          parent: value.parent,
        });
        await mutateCategory();
      } catch {
        toast.error("Error al actualizar la categoría.");
      }
    },
  });

  async function handleDelete() {
    setDeletePending(true);
    try {
      await deleteCategory();
      toast.success("Categoría eliminada correctamente.");
      setDeleteOpen(false);
      navigate({ to: "/categories" });
    } catch {
      toast.error("No se pudo eliminar la categoría.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-8"
      >
        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.isDirty]}
        >
          {([isSubmitting, isDirty]) => (
            <CategoryDetailHeader
              category={category}
              isDirty={isDirty}
              isSubmitting={isSubmitting}
              onSave={() => form.handleSubmit()}
              onDeleteClick={() => setDeleteOpen(true)}
            />
          )}
        </form.Subscribe>

        <Separator />

        <section id="information" className="scroll-mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FolderOpen className="size-4" />
                Información de la categoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="display_name">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Nombre de la categoría</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Electrónica"
                      disabled={isInactive}
                    />
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => [state.values.display_name]}>
                {([displayName]) => (
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={displayName.toLowerCase().replace(/\s+/g, "-")}
                      disabled
                    />
                  </div>
                )}
              </form.Subscribe>

              <form.Field name="description">
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Descripción</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Descripción opcional"
                      disabled={isInactive}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="parent">
                {(field) => (
                  <div className="grid gap-2">
                    <Label>Categoría padre</Label>
                    <Combobox
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      items={mockCategories}
                      itemToStringValue={(item) => item.id}
                      itemToStringLabel={(item) => item.display_name}
                    >
                      <ComboboxInput
                        placeholder="Selecciona una categoría padre..."
                        showTrigger
                        showClear
                        disabled={isInactive}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>
                          No se encontraron categorías
                        </ComboboxEmpty>

                        <ComboboxList>
                          {(item: Category) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.display_name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </section>
      </form>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{category.display_name}
              &quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletePending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
