import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  useCreateProductRequest,
  useListBrandsRequest,
  useListCategoriesRequest,
} from "@/lib/api/api";
import { CreateProductRequestBody } from "@/lib/api/zods";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Brand, Category } from "@/lib/api/schemas";

export function CreateProductDialog({
  onSuccess,
}: {
  onSuccess?: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const { trigger } = useCreateProductRequest();
  const { data: brandsRes, isLoading: brandsLoading } = useListBrandsRequest();
  const { data: categoriesRes, isLoading: categoriesLoading } =
    useListCategoriesRequest();

  const brands: Brand[] = brandsRes?.status === 200 ? brandsRes.data.data : [];
  const categories: Category[] =
    categoriesRes?.status === 200 ? categoriesRes.data.data : [];

  const form = useForm({
    defaultValues: {
      displayName: "",
      brandId: "",
      categoryId: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      const result = await trigger({
        display_name: value.displayName,
        brand_id: value.brandId,
        category_id: value.categoryId,
        description: value.description || null,
      });

      const errorData =
        "data" in result
          ? (result as { data: { message?: string } }).data
          : null;

      if (result.status === 201) {
        toast.success(`Producto "${value.displayName}" creado`);
        form.reset();
        setOpen(false);
        await onSuccess?.();
      } else {
        toast.error(errorData?.message ?? "Error al crear producto");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Crear Producto</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear producto</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo producto.
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
                  CreateProductRequestBody.shape.display_name.safeParse(value);
                if (!result.success) return result.error.issues[0].message;
                if (value.length < 3)
                  return "El nombre debe tener al menos 3 caracteres";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nombre visible</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Bicicleta de montaña"
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

          <form.Field
            name="brandId"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateProductRequestBody.shape.brand_id.safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Marca</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value ?? "")}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Selecciona una marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandsLoading ? (
                      <SelectItem value="loading" disabled>
                        Cargando marcas...
                      </SelectItem>
                    ) : brands.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No hay marcas registradas
                      </SelectItem>
                    ) : (
                      brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.display_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="categoryId"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateProductRequestBody.shape.category_id.safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0].message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Categoría</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value ?? "")}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        Cargando categorías...
                      </SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No hay categorías registradas
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.display_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) => {
                const result =
                  CreateProductRequestBody.shape.description.safeParse(
                    value || null
                  );
                if (!result.success) return result.error.issues[0].message;
                if (!value.trim()) return "La descripción es obligatoria";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Descripción</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descripción del producto"
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
                  {isSubmitting ? "Creando..." : "Crear Producto"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
