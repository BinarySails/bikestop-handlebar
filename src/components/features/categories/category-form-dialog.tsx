import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CategoryApiError,
  createCategory,
  invalidateCategories,
  updateCategory,
} from "@/lib/api/categories";
import type { Category } from "@/lib/api/schemas";

import { buildCategoryOptions, getDescendantIds } from "./category-hierarchy";

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  category?: Category | null;
  presentation?: "dialog" | "page";
};

function requiredMessage(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} es obligatorio.`;
}

function mutationErrorMessage(error: unknown, action: string): string {
  if (error instanceof CategoryApiError) {
    if (error.status === 400) return error.message;
    if (error.status === 404) return "La categoría ya no existe.";
  }
  return `No se pudo ${action} la categoría.`;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  categories,
  category,
  presentation = "dialog",
}: CategoryFormDialogProps) {
  const isEditing = Boolean(category);
  const blockedParentIds = category
    ? getDescendantIds(categories, category.id)
    : new Set<string>();
  if (category) blockedParentIds.add(category.id);

  const parentOptions = buildCategoryOptions(categories).filter(
    ({ category: option }) => !blockedParentIds.has(option.id)
  );

  const form = useForm({
    defaultValues: {
      display_name: category?.display_name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      parent_id: category?.parent_id ?? "",
    },
    onSubmit: async ({ value }) => {
      const input = {
        display_name: value.display_name.trim(),
        slug: value.slug.trim(),
        description: value.description.trim() || null,
        parent_id: value.parent_id || null,
      };

      try {
        if (category) {
          await updateCategory(category.id, input);
          toast.success("Categoría actualizada correctamente.");
        } else {
          await createCategory(input);
          toast.success("Categoría creada correctamente.");
        }
        await invalidateCategories();
        onOpenChange(false);
        form.reset();
      } catch (error) {
        toast.error(
          mutationErrorMessage(error, category ? "actualizar" : "crear")
        );
      }
    },
  });

  const formContent = (
    <>
      {presentation === "dialog" && (
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar categoría" : "Crear categoría"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información y la ubicación en la jerarquía."
              : "Agrega una categoría al catálogo de productos."}
          </DialogDescription>
        </DialogHeader>
      )}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="display_name"
          validators={{
            onBlur: ({ value }) => requiredMessage(value, "El nombre"),
            onSubmit: ({ value }) => requiredMessage(value, "El nombre"),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Nombre visible</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={`${field.name}-error`}
              />
              {field.state.meta.errors[0] && (
                <p
                  id={`${field.name}-error`}
                  className="text-sm text-destructive"
                >
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="slug"
          validators={{
            onBlur: ({ value }) => requiredMessage(value, "El slug"),
            onSubmit: ({ value }) => requiredMessage(value, "El slug"),
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Slug</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={`${field.name}-error`}
                placeholder="bicicletas-de-montana"
              />
              {field.state.meta.errors[0] && (
                <p
                  id={`${field.name}-error`}
                  className="text-sm text-destructive"
                >
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Descripción</Label>
              <Textarea
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="parent_id">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Categoría padre</Label>
              <select
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Sin categoría padre</option>
                {parentOptions.map(({ category: option, depth }) => (
                  <option key={option.id} value={option.id}>
                    {`${"— ".repeat(depth)}${option.display_name}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                La jerarquía puede tener varios niveles.
              </p>
            </div>
          )}
        </form.Field>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear categoría"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </>
  );

  if (presentation === "page") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información de la categoría</CardTitle>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">{formContent}</DialogContent>
    </Dialog>
  );
}
