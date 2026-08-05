import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  useCreateCategoryRequest,
  useGetCategoriesRequest,
} from "@/lib/api/api";
import { CreateCategoryRequestBody } from "@/lib/api/zods";

import { Button } from "@/components/ui/button";
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
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import type { Category } from "@/lib/api/schemas";

export function CreateCategoryDialog({
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const { trigger } = useCreateCategoryRequest();
  const { data: categoriesRes, isLoading: categoriesLoading } =
    useGetCategoriesRequest();

  const categories =
    categoriesRes?.status === 200 ? categoriesRes.data.categories : [];

  const form = useForm({
    defaultValues: {
      displayName: "",
      description: "",
      parent: null as null | Category,
    },
    onSubmit: async ({ value }) => {
      const slug = value.displayName.toLowerCase().replace(/\s+/g, "-");

      const result = await trigger({
        display_name: value.displayName,
        slug,
        description: value.description || null,
        parent_id: value.parent?.id || null,
      });

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null;

      if (result.status === 201) {
        toast.success(`Categoría "${value.displayName}" creada.`);
        form.reset();
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(errorData?.message ?? "Error al crear la categoría.");
      }
    },
  });

  return (
    <Dialog key="create-category" open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Crear Categoría</DialogTitle>
          <DialogDescription>
            Ingresa la información de la nueva categoría.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="displayName"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateCategoryRequestBody.shape.display_name.safeParse(value);
                if (!result.success) return result.error.issues[0].message;
                if (value.length < 3)
                  return "El nombre debe tener al menos 3 caracteres";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nombre de la categoría</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Electrónica"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? "true"
                      : undefined
                  }
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.values.displayName]}>
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

          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateCategoryRequestBody.shape.description.safeParse(
                    value || null
                  );
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Descripción (opcional)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descripción de la categoría"
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
                  items={categories}
                  itemToStringValue={(item) => item.id}
                  itemToStringLabel={(item) => item.display_name}
                >
                  <ComboboxInput
                    placeholder={
                      categoriesLoading
                        ? "Cargando categorías..."
                        : "Selecciona una categoría padre..."
                    }
                    showTrigger
                    showClear
                    disabled={categoriesLoading}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No se encontraron categorías</ComboboxEmpty>

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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Categoría"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
