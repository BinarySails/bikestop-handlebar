import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/features/products/image-upload-field";
import { EntityCreateButton } from "@/components/features/entity/entity-create-button";
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
import { useCreateVariantRequest } from "@/lib/api/api";
import { pesosToCents } from "@/lib/money";
import { CreateVariantRequestBody } from "@/lib/api/zods";

const MAX_PRICE_DECIMALS = 2;

function validateUrl(value: string): string | undefined {
  if (!value.trim()) return "La URL de la imagen es obligatoria.";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Ingresa una URL válida.";
    }
  } catch {
    return "Ingresa una URL válida.";
  }
  return undefined;
}

function validatePrice(value: string): string | undefined {
  if (!value.trim()) return "El precio es obligatorio.";
  const number = Number(value);
  if (Number.isNaN(number) || number <= 0) {
    return "El precio debe ser un número mayor a 0.";
  }
  const decimals = value.includes(".") ? (value.split(".")[1]?.length ?? 0) : 0;
  if (decimals > MAX_PRICE_DECIMALS) {
    return "El precio solo puede tener hasta 2 decimales.";
  }
  return undefined;
}

function validateSku(value: string): string | undefined {
  if (!value.trim()) return "El SKU es obligatorio.";
  return undefined;
}

function validateDisplayName(value: string): string | undefined {
  if (!value.trim()) return "El nombre es obligatorio.";
  if (value.trim().length < 3) {
    return "El nombre debe tener al menos 3 caracteres.";
  }
  return undefined;
}

function normalizePropertyInput(value: string): string {
  return value.trim().toLowerCase();
}

type PropertyRow = {
  propertyName: string;
  propertyValue: string;
};

export function CreateVariantDialog({
  productId,
  onSuccess,
}: {
  productId: string;
  onSuccess?: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const { trigger } = useCreateVariantRequest(productId);

  const form = useForm({
    defaultValues: {
      sku: "",
      displayName: "",
      imageUrl: "",
      properties: [] as PropertyRow[],
      price: "",
    },
    onSubmit: async ({ value }) => {
      const sku = value.sku.trim().toUpperCase();
      const displayName = value.displayName.trim();
      const imageUrl = value.imageUrl.trim();
      const priceAmount = Number(value.price);

      const propertyNames = new Set<string>();
      const normalizedProperties = value.properties.map((property) => {
        const property_name = normalizePropertyInput(property.propertyName);
        const property_value = normalizePropertyInput(property.propertyValue);
        propertyNames.add(property_name);
        return { property_name, property_value };
      });

      if (propertyNames.size !== normalizedProperties.length) {
        toast.error("No puede haber propiedades duplicadas.");
        return;
      }

      const payload = {
        sku,
        display_name: displayName,
        image_url: imageUrl,
        properties: normalizedProperties,
        prices: [
          {
            price_type: "regular" as const,
            amount: pesosToCents(priceAmount),
            currency: "MXN",
          },
        ],
      };

      const parseResult =
        await CreateVariantRequestBody.safeParseAsync(payload);
      if (!parseResult.success) {
        toast.error(parseResult.error.issues[0]?.message ?? "Datos inválidos.");
        return;
      }

      try {
        const result = await trigger(parseResult.data);

        if (result.status === 201) {
          toast.success(`Variante "${displayName}" creada.`);
          form.reset();
          setOpen(false);
          await onSuccess?.();
        } else {
          const errorData =
            "data" in result &&
            typeof result.data === "object" &&
            result.data !== null &&
            "message" in result.data
              ? (result.data as { message?: string }).message
              : undefined;
          toast.error(errorData ?? "Error al crear la variante.");
        }
      } catch {
        toast.error("Error al crear la variante.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<EntityCreateButton>Crear Variante</EntityCreateButton>}
      />

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear variante</DialogTitle>
          <DialogDescription>
            Ingresa la información de la nueva variante del producto.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="sku"
              validators={{
                onChange: ({ value }) => validateSku(value),
                onSubmit: ({ value }) => validateSku(value),
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>SKU</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(e.target.value.toUpperCase())
                    }
                    placeholder="SKU-123"
                    aria-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="displayName"
              validators={{
                onChange: ({ value }) => validateDisplayName(value),
                onSubmit: ({ value }) => validateDisplayName(value),
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
                    placeholder="Bicicleta roja"
                    aria-invalid={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <form.Field
            name="imageUrl"
            validators={{
              onChange: ({ value }) => validateUrl(value),
              onSubmit: ({ value }) => validateUrl(value),
            }}
          >
            {(field) => (
              <ImageUploadField
                id={field.name}
                label="Imagen"
                value={field.state.value}
                onChange={(url) => field.handleChange(url)}
              />
            )}
          </form.Field>

          <form.Field
            name="price"
            validators={{
              onChange: ({ value }) => validatePrice(value),
              onSubmit: ({ value }) => validatePrice(value),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Precio regular (MXN)</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="199.99"
                  aria-invalid={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="properties"
            validators={{
              onSubmit: ({ value }) => {
                if (value.length === 0) {
                  return "Debe haber al menos una propiedad.";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Propiedades</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      field.pushValue({
                        propertyName: "",
                        propertyValue: "",
                      })
                    }
                  >
                    <Plus className="size-4" />
                    Agregar propiedad
                  </Button>
                </div>

                {field.state.value.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay propiedades agregadas.
                  </p>
                )}

                {field.state.value.map((_, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <form.Field name={`properties[${index}].propertyName`}>
                      {(subField) => (
                        <div className="grid flex-1 gap-1.5">
                          <Label htmlFor={subField.name} className="text-xs">
                            Nombre
                          </Label>
                          <Input
                            id={subField.name}
                            value={subField.state.value}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                            placeholder="color"
                          />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name={`properties[${index}].propertyValue`}>
                      {(subField) => (
                        <div className="grid flex-1 gap-1.5">
                          <Label htmlFor={subField.name} className="text-xs">
                            Valor
                          </Label>
                          <Input
                            id={subField.name}
                            value={subField.state.value}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                            placeholder="rojo"
                          />
                        </div>
                      )}
                    </form.Field>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-5 size-8 text-destructive"
                      onClick={() => field.removeValue(index)}
                      aria-label="Eliminar propiedad"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}

                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">
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
                  {isSubmitting ? "Creando..." : "Crear Variante"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
